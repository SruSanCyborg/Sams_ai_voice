"use client";

import { useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  DataPacket_Kind,
} from "livekit-client";
import { useRoomStore } from "@/store/useRoomStore";
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
  const {
    setLocalId,
    addParticipant,
    removeParticipant,
    updateSpeaking,
    updatePosition,
    getLocalParticipant,
  } = useRoomStore();

  useEffect(() => {
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

      room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        if (!mounted) return;
        addParticipant(p.sid, p.name ?? p.sid, false);
      });

      room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        if (!mounted) return;
        removeParticipant(p.sid);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!mounted) return;
        const speakerIds = new Set(speakers.map((s) => s.sid));
        useRoomStore.getState().participants.forEach((p) => {
          updateSpeaking(p.id, speakerIds.has(p.id));
        });
      });

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
        token
      );

      if (!mounted) return;

      const local = room.localParticipant;
      setLocalId(local.sid);
      addParticipant(local.sid, local.name ?? userName, true);

      // Add existing remote participants
      room.remoteParticipants.forEach((p) => {
        addParticipant(p.sid, p.name ?? p.sid, false);
      });

      // Broadcast local position every 50ms
      broadcastTimer.current = setInterval(() => {
        const localP = getLocalParticipant();
        if (!localP) return;
        const msg = JSON.stringify({ type: "position", position: localP.position });
        room.localParticipant.publishData(
          new TextEncoder().encode(msg),
          { reliable: false }
        );
      }, POSITION_BROADCAST_INTERVAL_MS);
    }

    connect().catch(console.error);

    return () => {
      mounted = false;
      if (broadcastTimer.current) clearInterval(broadcastTimer.current);
      roomRef.current?.disconnect();
    };
  }, [roomId, userName]);

  return <>{children}</>;
}
