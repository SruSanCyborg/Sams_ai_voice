"use client";

import { useEffect } from "react";
import {
  useRemoteParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useRoomStore } from "@/store/useRoomStore";
import { POSITION_BROADCAST_INTERVAL_MS } from "@/lib/constants";
import type { Vec3 } from "@/types/spatial";

interface Props {
  userName: string;
}

export function LiveKitBridge({ userName }: Props) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const {
    setLocalId, setHost,
    addParticipant, removeParticipant,
    updateSpeaking, updatePosition,
    getLocalParticipant,
  } = useRoomStore();

  // ── Local participant ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!localParticipant) return;
    // Remove any stale "isLocal" entry from a previous SID (happens on reconnect)
    const { participants } = useRoomStore.getState();
    participants.forEach((p, id) => {
      if (p.isLocal && id !== localParticipant.sid) removeParticipant(id);
    });
    setLocalId(localParticipant.sid);
    addParticipant(localParticipant.sid, localParticipant.name ?? userName, true);
  }, [localParticipant?.sid]);

  // ── Remote participants ────────────────────────────────────────────────────
  useEffect(() => {
    const remoteIds = new Set(remoteParticipants.map((p) => p.sid));

    remoteParticipants.forEach((p) => addParticipant(p.sid, p.name ?? p.sid, false));

    // Prune departed participants from store
    const store = useRoomStore.getState();
    store.participants.forEach((p, id) => {
      if (!p.isLocal && !remoteIds.has(id)) removeParticipant(id);
    });

    // Host = earliest joiner
    if (localParticipant) {
      if (remoteParticipants.length === 0) {
        setHost(localParticipant.sid);
      } else {
        const earliest = [...remoteParticipants].sort(
          (a, b) => (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0),
        )[0];
        setHost(earliest?.sid ?? localParticipant.sid);
      }
    }
  }, [remoteParticipants.map((p) => p.sid).join(",")]);

  // ── Speaking indicators ────────────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    const handler = (speakers: { sid: string }[]) => {
      const ids = new Set(speakers.map((s) => s.sid));
      useRoomStore.getState().participants.forEach((p) => updateSpeaking(p.id, ids.has(p.id)));
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handler);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, handler); };
  }, [room]);

  // ── Position broadcast + receive ───────────────────────────────────────────
  useEffect(() => {
    if (!room || !localParticipant) return;

    const onData = (payload: Uint8Array, participant: { sid: string } | undefined) => {
      if (!participant) return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "position") updatePosition(participant.sid, msg.position as Vec3);
      } catch {}
    };
    room.on(RoomEvent.DataReceived, onData);

    const timer = setInterval(() => {
      const local = getLocalParticipant();
      if (!local) return;
      const msg = JSON.stringify({ type: "position", position: local.position });
      localParticipant.publishData(new TextEncoder().encode(msg), { reliable: false });
    }, POSITION_BROADCAST_INTERVAL_MS);

    return () => {
      room.off(RoomEvent.DataReceived, onData);
      clearInterval(timer);
    };
  }, [room, localParticipant?.sid]);

  return null;
}
