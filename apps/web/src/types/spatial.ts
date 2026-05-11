export type Vec3 = [number, number, number];

export interface HRTFPair {
  left: Float32Array;
  right: Float32Array;
}

export interface HRTFEntry {
  azimuth: number;
  elevation: number;
  left: Float32Array;
  right: Float32Array;
}

export type EmotionLabel = "neutral" | "happy" | "sad" | "angry" | "excited";

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  neutral: "#94a3b8",
  happy: "#fbbf24",
  sad: "#60a5fa",
  angry: "#f87171",
  excited: "#22d3ee",
};

export type RoomPreset = "studio" | "concert_hall" | "cave" | "outdoor" | "bathroom";

export type VoiceMorphPreset = "none" | "robot" | "chipmunk" | "deep" | "radio" | "echo";

export const VOICE_MORPH_SEMITONES: Record<VoiceMorphPreset, number> = {
  none: 0,
  chipmunk: 7,
  robot: 12,
  deep: -5,
  radio: 0,
  echo: 0,
};
