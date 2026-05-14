import type { VoiceMorphPreset } from "@/types/spatial";

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export class VoiceMorphPipeline {
  private ctx: AudioContext | null = null;
  private rawStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private effectInput: GainNode | null = null;
  private effectOutput: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private effectNodes: AudioNode[] = [];

  async init(): Promise<MediaStream> {
    this.rawStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });

    this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: "interactive" });
    this.source = this.ctx.createMediaStreamSource(this.rawStream);
    this.effectInput = this.ctx.createGain();
    this.effectOutput = this.ctx.createGain();
    this.destination = this.ctx.createMediaStreamDestination();

    this.source.connect(this.effectInput);
    this.effectOutput.connect(this.destination);
    this.applyPreset("none");

    return this.destination.stream;
  }

  private clearEffects(): void {
    this.effectNodes.forEach((n) => {
      try { (n as OscillatorNode).stop?.(); } catch {}
      try { n.disconnect(); } catch {}
    });
    this.effectNodes = [];
    try { this.effectInput?.disconnect(); } catch {}
  }

  applyPreset(preset: VoiceMorphPreset): void {
    if (!this.ctx || !this.effectInput || !this.effectOutput) return;
    this.clearEffects();
    const ctx = this.ctx;

    switch (preset) {
      case "none": {
        this.effectInput.connect(this.effectOutput);
        break;
      }
      case "chipmunk": {
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = 400; hp.Q.value = 1.2;
        const hs = ctx.createBiquadFilter();
        hs.type = "highshelf"; hs.frequency.value = 1800; hs.gain.value = 10;
        const pk = ctx.createBiquadFilter();
        pk.type = "peaking"; pk.frequency.value = 3200; pk.Q.value = 2; pk.gain.value = 8;
        const g = ctx.createGain(); g.gain.value = 0.65;
        this.effectInput.connect(hp); hp.connect(hs); hs.connect(pk); pk.connect(g); g.connect(this.effectOutput);
        this.effectNodes = [hp, hs, pk, g];
        break;
      }
      case "robot": {
        const osc = ctx.createOscillator();
        osc.frequency.value = 80; osc.type = "square";
        const ring = ctx.createGain(); ring.gain.value = 0;
        osc.connect(ring.gain);
        const dry = ctx.createGain(); dry.gain.value = 0.25;
        const out = ctx.createGain(); out.gain.value = 2.0;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000;
        this.effectInput.connect(ring); this.effectInput.connect(dry);
        ring.connect(lp); lp.connect(out); out.connect(this.effectOutput); dry.connect(this.effectOutput);
        osc.start();
        this.effectNodes = [osc, ring, dry, out, lp];
        break;
      }
      case "deep": {
        const ls = ctx.createBiquadFilter();
        ls.type = "lowshelf"; ls.frequency.value = 400; ls.gain.value = 14;
        const hs = ctx.createBiquadFilter();
        hs.type = "highshelf"; hs.frequency.value = 2500; hs.gain.value = -12;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18; comp.ratio.value = 4;
        this.effectInput.connect(ls); ls.connect(hs); hs.connect(comp); comp.connect(this.effectOutput);
        this.effectNodes = [ls, hs, comp];
        break;
      }
      case "radio": {
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 300;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000;
        const dist = ctx.createWaveShaper();
        dist.curve = makeDistortionCurve(60); dist.oversample = "4x";
        const g = ctx.createGain(); g.gain.value = 0.55;
        this.effectInput.connect(hp); hp.connect(lp); lp.connect(dist); dist.connect(g); g.connect(this.effectOutput);
        this.effectNodes = [hp, lp, dist, g];
        break;
      }
      case "echo": {
        const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.35;
        const fb = ctx.createGain(); fb.gain.value = 0.45;
        const dry = ctx.createGain(); dry.gain.value = 0.75;
        const wet = ctx.createGain(); wet.gain.value = 0.45;
        delay.connect(fb); fb.connect(delay);
        this.effectInput.connect(dry); this.effectInput.connect(delay);
        delay.connect(wet); dry.connect(this.effectOutput); wet.connect(this.effectOutput);
        this.effectNodes = [delay, fb, dry, wet];
        break;
      }
    }
  }

  setMicEnabled(enabled: boolean): void {
    this.rawStream?.getTracks().forEach((t) => { t.enabled = enabled; });
  }

  stop(): void {
    this.clearEffects();
    try { this.source?.disconnect(); } catch {}
    try { this.destination?.disconnect(); } catch {}
    this.ctx?.close().catch(() => {});
    this.rawStream?.getTracks().forEach((t) => t.stop());
    this.ctx = null;
    this.rawStream = null;
  }
}
