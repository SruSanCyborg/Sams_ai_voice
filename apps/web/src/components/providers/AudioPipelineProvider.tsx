"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AudioPipeline } from "@/audio/pipeline/AudioPipeline";
import { useRoomStore } from "@/store/useRoomStore";
import { useAudioStore } from "@/store/useAudioStore";

const Ctx = createContext<AudioPipeline | null>(null);

export function AudioPipelineProvider({ children }: { children: React.ReactNode }) {
  const pipeline = useRef(new AudioPipeline());
  const { updateSpeaking, updateEmotion, addCaption, localId } = useRoomStore();
  const { micEnabled, speakerEnabled, roomPreset } = useAudioStore();

  useEffect(() => {
    const p = pipeline.current;

    p.onSpeaking = (speaking, amplitude) => {
      if (localId) updateSpeaking(localId, speaking, amplitude);
    };
    p.onEmotion = (emotion) => {
      if (localId) updateEmotion(localId, emotion as any);
    };

    p.init().catch(console.error);
    return () => p.destroy();
  }, []);

  useEffect(() => {
    pipeline.current.setMicEnabled(micEnabled);
  }, [micEnabled]);

  useEffect(() => {
    pipeline.current.setSpeakerEnabled(speakerEnabled);
  }, [speakerEnabled]);

  useEffect(() => {
    pipeline.current.setRoomPreset(roomPreset);
  }, [roomPreset]);

  return <Ctx.Provider value={pipeline.current}>{children}</Ctx.Provider>;
}

export function useAudioPipeline() {
  return useContext(Ctx);
}
