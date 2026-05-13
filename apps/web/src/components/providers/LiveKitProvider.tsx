"use client";

import { useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from "livekit-client";
import { useRoomStore } from "@/store/useRoomStore";
import { useAudioStore } from "@/store/useAudioStore";
import { useAudioPipeline } from "@/components/providers/AudioPipelineProvider";
import { POSITION_BROADCAST_INTERVAL_MS } from "@/lib/constants";
import type { Vec3 } from "@/types/spatial";

interface Props {
  roomId: string;
  userName: string;
  children: React.ReactNode;
}

export function LiveKitProvider({ roomId, userName, children }: Props) {
  const roomRef = useRef<Room | null>(null);
  const broadcastTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipeline = useAudioPipeline();
  const { micEnabled } = useAudioStore();
  const {
    setLocalId,
    setHost,
    addParticipant,
    removeParticipant,
    updateSpeaking,
    updatePosition,
    getLocalParticipant,
  } = useRoomStore();

  // Connect once on mount
  useEffect(() => {
    if (!pipeline) return;
    const p = pipeline;
    let mounted = true;

    async function connect() {
      const res = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, participantName: userName }),
      });
      const { token, livekit_url } = await res.json();

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      // ── Remote audio track wiring ──────────────────────────────────────
      room.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack,
        _pub: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        if (!mounted || track.kind !== Track.Kind.Audio) return;
        p.addRemoteTrack(participant.sid, track.mediaStreamTrack);
      });

      room.on(RoomEvent.TrackUnsubscribed, (
        track: RemoteTrack,
        _pub: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        if (!mounted || track.kind !== Track.Kind.Audio) return;
        p.removeRemoteTrack(participant.sid);
      });

      // ── Participant lifecycle ──────────────────────────────────────────
      room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        if (!mounted) return;
        addParticipant(p.sid, p.name ?? p.sid, false);
      });

      room.on(RoomEvent.ParticipantDisconnected, (rp: RemoteParticipant) => {
        if (!mounted) return;
        removeParticipant(rp.sid);
        p.removeRemoteTrack(rp.sid);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!mounted) return;
        const speakerIds = new Set(speakers.map((s) => s.sid));
        useRoomStore.getState().participants.forEach((p) => {
          updateSpeaking(p.id, speakerIds.has(p.id));
        });
      });

      // ── Spatial position sync ─────────────────────────────────────────
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        if (!mounted || !participant) return;
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === "position") {
            updatePosition(participant.sid, msg.position as Vec3);
          }
        } catch {}
      });

      await room.connect(
        livekit_url ?? process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880",
        token,
      );

      if (!mounted) return;

      const local = room.localParticipant;
      setLocalId(local.sid);
      addParticipant(local.sid, local.name ?? userName, true);

      // First person in = host; otherwise earliest joiner is host
      if (room.remoteParticipants.size === 0) {
        setHost(local.sid);
      } else {
        const earliest = [...room.remoteParticipants.values()].sort(
          (a, b) => (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0)
        )[0];
        setHost(earliest?.sid ?? local.sid);
      }

      // Wire audio for participants already in the room
      room.remoteParticipants.forEach((rp) => {
        addParticipant(rp.sid, rp.name ?? rp.sid, false);
        rp.audioTrackPublications.forEach((pub) => {
          if (pub.track) {
            p.addRemoteTrack(rp.sid, pub.track.mediaStreamTrack);
          }
        });
      });

      // Enable local mic — LiveKit handles capture + publish
      await room.localParticipant.setMicrophoneEnabled(true);

      // Broadcast local position at 50ms intervals
      broadcastTimer.current = setInterval(() => {
        const localP = getLocalParticipant();
        if (!localP) return;
        const msg = JSON.stringify({ type: "position", position: localP.position });
        room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: false });
      }, POSITION_BROADCAST_INTERVAL_MS);
    }

    connect().catch(console.error);

    return () => {
      mounted = false;
      if (broadcastTimer.current) clearInterval(broadcastTimer.current);
      roomRef.current?.disconnect();
    };
  }, [roomId, userName, pipeline]);

  // Keep LiveKit mic in sync with the UI mute button
  useEffect(() => {
    roomRef.current?.localParticipant.setMicrophoneEnabled(micEnabled).catch(() => {});
  }, [micEnabled]);

  return <>{children}</>;
}
