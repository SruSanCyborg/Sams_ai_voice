"use client";

import { useEffect, useRef } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, RemoteAudioTrack } from "livekit-client";
import { useRoomStore } from "@/store/useRoomStore";

// ── Shared AudioContext ───────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContext({ latencyHint: "interactive", sampleRate: 48000 });
  }
  return _ctx;
}

export function resumeAudioCtx() {
  getAudioCtx().resume().catch(() => {});
}

// ── Master bus with Schroeder reverb ─────────────────────────────────────────
let _masterBus: GainNode | null = null;
let _dryGain: GainNode | null = null;
let _wetGain: GainNode | null = null;
let _reverbNodes: AudioNode[] = [];

function getMasterBus(): GainNode {
  const ctx = getAudioCtx();
  if (_masterBus) return _masterBus;
  _masterBus = ctx.createGain();
  _dryGain = ctx.createGain();
  _wetGain = ctx.createGain();
  _wetGain.gain.value = 0;
  _masterBus.connect(_dryGain);
  _masterBus.connect(_wetGain);
  _dryGain.connect(ctx.destination);
  _wetGain.connect(ctx.destination);
  return _masterBus;
}

const REVERB_PARAMS: Record<string, { scale: number; decay: number; wet: number }> = {
  concert_hall: { scale: 2.5, decay: 0.72, wet: 0.28 },
  cave:         { scale: 3.8, decay: 0.85, wet: 0.40 },
  outdoor:      { scale: 1.0, decay: 0.25, wet: 0.10 },
  bathroom:     { scale: 0.7, decay: 0.55, wet: 0.22 },
};

export function applyRoomPreset(preset: string): void {
  const ctx = getAudioCtx();
  getMasterBus(); // ensure bus exists
  _reverbNodes.forEach((n) => { try { n.disconnect(); } catch {} });
  _reverbNodes = [];

  if (preset === "studio" || !REVERB_PARAMS[preset]) {
    _wetGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    return;
  }

  const { scale, decay, wet } = REVERB_PARAMS[preset];
  const mix = ctx.createGain();
  mix.gain.value = 0.25;

  // 4 comb filters (Schroeder reverb network)
  [0.0297, 0.0371, 0.0411, 0.0437].forEach((t) => {
    const del = ctx.createDelay(2.0);
    del.delayTime.value = t * scale;
    const fb = ctx.createGain();
    fb.gain.value = decay;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4500;
    del.connect(lp); lp.connect(fb); fb.connect(del);
    _masterBus!.connect(del);
    del.connect(mix);
    _reverbNodes.push(del, fb, lp);
  });

  mix.connect(_wetGain!);
  _reverbNodes.push(mix);
  _wetGain!.gain.setTargetAtTime(wet, ctx.currentTime, 0.15);
}

// ── One spatial node per remote track ────────────────────────────────────────
function SpatialTrack({ sid, track }: { sid: string; track: RemoteAudioTrack }) {
  const pannerRef = useRef<PannerNode | null>(null);
  const position = useRoomStore((s) => s.participants.get(sid)?.position ?? [0, 0, -2]);

  useEffect(() => {
    const ctx = getAudioCtx();
    ctx.resume();
    const bus = getMasterBus();

    const el = track.attach() as HTMLAudioElement;
    el.style.display = "none";

    let source: MediaElementAudioSourceNode | null = null;
    let panner: PannerNode | null = null;

    try {
      source = ctx.createMediaElementSource(el);
      panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.rolloffFactor = 1;
      panner.setPosition(position[0], position[1], position[2]);
      pannerRef.current = panner;
      source.connect(panner);
      panner.connect(bus);
    } catch {
      el.autoplay = true;
      document.body.appendChild(el);
    }

    return () => {
      track.detach(el);
      source?.disconnect();
      panner?.disconnect();
      pannerRef.current = null;
      el.remove();
    };
  }, [track]);

  useEffect(() => {
    pannerRef.current?.setPosition(position[0], position[1], position[2]);
  }, [position]);

  return null;
}

// ── Root renderer ─────────────────────────────────────────────────────────────
export function SpatialAudioRenderer() {
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: true });

  return (
    <>
      {tracks
        .filter((t) => !t.participant.isLocal && t.publication?.isSubscribed && t.publication.track)
        .map((t) => (
          <SpatialTrack
            key={t.participant.sid}
            sid={t.participant.sid}
            track={t.publication!.track as RemoteAudioTrack}
          />
        ))}
    </>
  );
}
