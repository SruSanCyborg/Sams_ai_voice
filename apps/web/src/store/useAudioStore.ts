import { create } from "zustand";
import type { RoomPreset, VoiceMorphPreset } from "@/types/spatial";

interface AudioState {
  micEnabled: boolean;
  speakerEnabled: boolean;
  captionsEnabled: boolean;
  accessibilityMode: boolean;
  isRecording: boolean;
  roomPreset: RoomPreset;
  voiceMorph: VoiceMorphPreset;
  musicEnabled: boolean;
  musicVolume: number;

  setMic: (v: boolean) => void;
  setSpeaker: (v: boolean) => void;
  setCaptions: (v: boolean) => void;
  setAccessibility: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setRoomPreset: (p: RoomPreset) => void;
  setVoiceMorph: (m: VoiceMorphPreset) => void;
  setMusicEnabled: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  micEnabled: true,
  speakerEnabled: true,
  captionsEnabled: false,
  accessibilityMode: false,
  isRecording: false,
  roomPreset: "studio",
  voiceMorph: "none",
  musicEnabled: false,
  musicVolume: 0.3,

  setMic: (v) => set({ micEnabled: v }),
  setSpeaker: (v) => set({ speakerEnabled: v }),
  setCaptions: (v) => set({ captionsEnabled: v }),
  setAccessibility: (v) => set({ accessibilityMode: v }),
  setRecording: (v) => set({ isRecording: v }),
  setRoomPreset: (p) => set({ roomPreset: p }),
  setVoiceMorph: (m) => set({ voiceMorph: m }),
  setMusicEnabled: (v) => set({ musicEnabled: v }),
  setMusicVolume: (v) => set({ musicVolume: v }),
}));
