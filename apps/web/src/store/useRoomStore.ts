import { create } from "zustand";
import type { Participant, Caption } from "@/types/room";
import type { Vec3 } from "@/types/spatial";
import { participantColor } from "@/lib/hrtfUtils";

interface RoomState {
  participants: Map<string, Participant>;
  captions: Caption[];
  localId: string | null;
  hostId: string | null;

  setLocalId: (id: string) => void;
  setHost: (id: string) => void;
  addParticipant: (id: string, name: string, isLocal: boolean) => void;
  removeParticipant: (id: string) => void;
  updatePosition: (id: string, position: Vec3) => void;
  updateSpeaking: (id: string, speaking: boolean, amplitude?: number) => void;
  updateEmotion: (id: string, emotion: Participant["emotion"]) => void;
  addCaption: (caption: Caption) => void;
  getLocalParticipant: () => Participant | undefined;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  participants: new Map(),
  captions: [],
  localId: null,
  hostId: null,

  setLocalId(id) { set({ localId: id }); },
  setHost(id) { set({ hostId: id }); },

  addParticipant(id, name, isLocal) {
    set((s) => {
      const next = new Map(s.participants);
      next.set(id, {
        id,
        name,
        position: [0, 0, isLocal ? 0 : (Math.random() - 0.5) * 6],
        speaking: false,
        amplitude: 0,
        emotion: "neutral",
        isLocal,
        color: participantColor(id),
      });
      return { participants: next };
    });
  },

  removeParticipant(id) {
    set((s) => {
      const next = new Map(s.participants);
      next.delete(id);
      // If host leaves, assign to next participant
      const newHost = s.hostId === id
        ? ([...next.values()].find(p => !p.isLocal)?.id ?? [...next.values()][0]?.id ?? null)
        : s.hostId;
      return { participants: next, hostId: newHost };
    });
  },

  updatePosition(id, position) {
    set((s) => {
      const p = s.participants.get(id);
      if (!p) return s;
      const next = new Map(s.participants);
      next.set(id, { ...p, position });
      return { participants: next };
    });
  },

  updateSpeaking(id, speaking, amplitude = 0) {
    set((s) => {
      const p = s.participants.get(id);
      if (!p) return s;
      const next = new Map(s.participants);
      next.set(id, { ...p, speaking, amplitude });
      return { participants: next };
    });
  },

  updateEmotion(id, emotion) {
    set((s) => {
      const p = s.participants.get(id);
      if (!p) return s;
      const next = new Map(s.participants);
      next.set(id, { ...p, emotion });
      return { participants: next };
    });
  },

  addCaption(caption) {
    set((s) => ({ captions: [...s.captions.slice(-20), caption] }));
  },

  getLocalParticipant() {
    const { localId, participants } = get();
    if (!localId) return undefined;
    return participants.get(localId);
  },

  resetRoom() {
    set({ participants: new Map(), captions: [], localId: null, hostId: null });
  },
}));
