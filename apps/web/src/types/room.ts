import type { EmotionLabel, Vec3 } from "./spatial";

export interface Participant {
  id: string;
  name: string;
  position: Vec3;
  speaking: boolean;
  amplitude: number;
  emotion: EmotionLabel;
  isLocal: boolean;
  color: string;
}

export interface Caption {
  id: string;
  participantId: string;
  text: string;
  timestamp: number;
}
