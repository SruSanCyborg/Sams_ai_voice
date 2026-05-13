"use client";

import { useEffect, useRef } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, RemoteAudioTrack } from "livekit-client";
import { useRoomStore } from "@/store/useRoomStore";

// One shared AudioContext for all spatial rendering
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

// ─────────────────────────────────────────────────────────────────────────────
// One spatial audio node per remote track
// ─────────────────────────────────────────────────────────────────────────────
function SpatialTrack({ sid, track }: { sid: string; track: RemoteAudioTrack }) {
  const pannerRef = useRef<PannerNode | null>(null);
  const position = useRoomStore((s) => s.participants.get(sid)?.position ?? [0, 0, -2]);

  useEffect(() => {
    const ctx = getAudioCtx();
    ctx.resume();

    // attach() sets srcObject on a fresh <audio> element — LiveKit handles this reliably
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
      panner.connect(ctx.destination);
    } catch {
      // If Web Audio fails, fall back to direct stereo playback
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

  // Keep panner in sync with 3D position
  useEffect(() => {
    pannerRef.current?.setPosition(position[0], position[1], position[2]);
  }, [position]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root renderer — renders one SpatialTrack per subscribed remote microphone
// ─────────────────────────────────────────────────────────────────────────────
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
