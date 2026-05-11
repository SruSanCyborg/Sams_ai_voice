import { SAMPLE_RATE, WHISPER_DISTANCE } from "@/lib/constants";
import { HRTFBank } from "@/audio/hrtf/HRTFBank";
import { cartesianToSpherical } from "@/lib/hrtfUtils";
import type { Vec3, RoomPreset } from "@/types/spatial";

// Central audio pipeline orchestrator.
// Spatial rendering uses:
//   1. Browser built-in PannerNode (Web Audio HRTF) — works immediately
//   2. Custom WASM UPOLS convolver — drops in when WASM is built
export class AudioPipeline {
  private ctx: AudioContext | null = null;
  private captureWorklet: AudioWorkletNode | null = null;

  // Per-participant nodes
  private panners = new Map<string, PannerNode>();
  private convNodes = new Map<string, ConvolverNode>();
  private gainNodes = new Map<string, GainNode>();

  private hrtfBank = new HRTFBank();
  private listenerPosition: Vec3 = [0, 0, 0];
  private listenerYaw = 0; // degrees
  private roomIR: AudioBuffer | null = null;
  private publishDest: MediaStreamAudioDestinationNode | null = null;
  private captureSource: MediaStreamAudioSourceNode | null = null;
  private muteGain: GainNode | null = null;

  onSpeaking?: (speaking: boolean, amplitude: number) => void;
  onEmotion?: (emotion: string) => void;

  async init(): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: "interactive" });

    // Try to load HRTF bank for custom convolution (optional enhancement)
    try {
      await this.hrtfBank.load("/hrtf/sonicom_hrtf.bin");
      console.log(`[AudioPipeline] HRTF bank: ${this.hrtfBank.entryCount} positions`);
    } catch {
      console.info("[AudioPipeline] Using browser built-in HRTF (PannerNode)");
    }

    // Register AudioWorklet processors
    try {
      await this.ctx.audioWorklet.addModule("/worklets/capture.worklet.js");
      await this.ctx.audioWorklet.addModule("/worklets/hrtf.worklet.js");
    } catch (err) {
      console.warn("[AudioPipeline] AudioWorklet load failed:", err);
    }

    // Configure 3D listener
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    }
  }

  async startCapture(stream: MediaStream): Promise<MediaStream> {
    if (!this.ctx) throw new Error("AudioPipeline not initialized");

    this.captureSource = this.ctx.createMediaStreamSource(stream);
    this.publishDest = this.ctx.createMediaStreamDestination();

    // Mute gain for mic toggle
    this.muteGain = this.ctx.createGain();
    this.muteGain.gain.value = 1;

    // Amplitude analyser for VAD
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 256;
    const rmsBuffer = new Float32Array(analyser.fftSize);

    this.captureSource.connect(this.muteGain);
    this.muteGain.connect(analyser);
    this.muteGain.connect(this.publishDest);

    // Poll RMS for speaking detection at 20Hz
    const vadInterval = setInterval(() => {
      if (!this.ctx) { clearInterval(vadInterval); return; }
      analyser.getFloatTimeDomainData(rmsBuffer);
      let sum = 0;
      for (let i = 0; i < rmsBuffer.length; i++) sum += rmsBuffer[i] ** 2;
      const rms = Math.sqrt(sum / rmsBuffer.length);
      this.onSpeaking?.(rms > 0.007, Math.min(1, rms * 25));
    }, 50);

    return this.publishDest.stream;
  }

  addRemoteTrack(participantId: string, track: MediaStreamTrack): void {
    if (!this.ctx) return;
    if (this.panners.has(participantId)) this.removeRemoteTrack(participantId);

    const stream = new MediaStream([track]);
    const source = this.ctx.createMediaStreamSource(stream);

    // PannerNode with HRTF — browser's built-in spatial audio
    const panner = this.ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 20;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    panner.setPosition(0, 0, -3); // default: in front

    // Room acoustics convolver (wet/dry mix)
    const convolver = this.ctx.createConvolver();
    convolver.normalize = true;
    if (this.roomIR) convolver.buffer = this.roomIR;

    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.15;
    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 0.85;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 1;

    source.connect(panner);
    panner.connect(dryGain);
    panner.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    this.panners.set(participantId, panner);
    this.convNodes.set(participantId, convolver);
    this.gainNodes.set(participantId, masterGain);
  }

  removeRemoteTrack(participantId: string): void {
    this.panners.get(participantId)?.disconnect();
    this.panners.delete(participantId);
    this.convNodes.delete(participantId);
    this.gainNodes.delete(participantId);
  }

  updateParticipantPosition(participantId: string, sourcePos: Vec3): void {
    const panner = this.panners.get(participantId);
    if (!panner || !this.ctx) return;

    // Relative position from listener
    const rx = sourcePos[0] - this.listenerPosition[0];
    const ry = sourcePos[1] - this.listenerPosition[1];
    const rz = sourcePos[2] - this.listenerPosition[2];

    if (panner.positionX) {
      const t = this.ctx.currentTime;
      panner.positionX.setTargetAtTime(rx, t, 0.05);
      panner.positionY.setTargetAtTime(ry, t, 0.05);
      panner.positionZ.setTargetAtTime(rz, t, 0.05);
    } else {
      panner.setPosition(rx, ry, rz);
    }

    // Whisper mode: reduce gain when very close
    const master = this.gainNodes.get(participantId);
    if (master) {
      const dist = Math.sqrt(rx * rx + ry * ry + rz * rz);
      // Near whisper zone: slightly lower overall gain for intimacy effect
      const gain = dist < WHISPER_DISTANCE ? 0.7 : 1.0;
      master.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.1);
    }
  }

  updateListenerPosition(pos: Vec3): void {
    this.listenerPosition = pos;
    if (!this.ctx) return;
    const l = this.ctx.listener;
    if (l.positionX) {
      l.positionX.value = pos[0];
      l.positionY.value = pos[1];
      l.positionZ.value = pos[2];
    } else {
      l.setPosition(pos[0], pos[1], pos[2]);
    }
  }

  updateListenerOrientation(yawDeg: number): void {
    this.listenerYaw = yawDeg;
    if (!this.ctx) return;
    const rad = (yawDeg * Math.PI) / 180;
    const fx = Math.sin(rad);
    const fz = -Math.cos(rad);
    const l = this.ctx.listener;
    if (l.forwardX) {
      l.forwardX.value = fx;
      l.forwardY.value = 0;
      l.forwardZ.value = fz;
    } else {
      l.setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }

  async setRoomPreset(preset: RoomPreset): Promise<void> {
    if (!this.ctx) return;

    if (preset === "studio") {
      this.roomIR = null;
      this.convNodes.forEach((n) => (n.buffer = null));
      return;
    }

    try {
      const res = await fetch(`/ir/${preset}.wav`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.arrayBuffer();
      this.roomIR = await this.ctx.decodeAudioData(raw);
      this.convNodes.forEach((n) => (n.buffer = this.roomIR));
    } catch (err) {
      console.warn(`[AudioPipeline] IR for ${preset} not loaded:`, err);
    }
  }

  setMicEnabled(enabled: boolean): void {
    if (this.muteGain && this.ctx) {
      this.muteGain.gain.setTargetAtTime(enabled ? 1 : 0, this.ctx.currentTime, 0.02);
    }
  }

  setSpeakerEnabled(enabled: boolean): void {
    if (!this.ctx) return;
    this.gainNodes.forEach((g) => {
      g.gain.setTargetAtTime(enabled ? 1 : 0, this.ctx!.currentTime, 0.05);
    });
  }

  setEmotionReverb(wetGainValue: number): void {
    // Adjust reverb for all participants based on detected emotion
    this.convNodes.forEach((convolver, id) => {
      const gain = this.gainNodes.get(id);
      if (!gain || !this.ctx) return;
    });
  }

  destroy(): void {
    this.panners.forEach((n) => n.disconnect());
    this.convNodes.forEach((n) => n.disconnect());
    this.gainNodes.forEach((n) => n.disconnect());
    this.captureSource?.disconnect();
    this.muteGain?.disconnect();
    this.ctx?.close();
    this.ctx = null;
  }
}
