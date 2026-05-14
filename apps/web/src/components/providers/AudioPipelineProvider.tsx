"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { AudioPipeline } from "@/audio/pipeline/AudioPipeline";
import { useAudioStore } from "@/store/useAudioStore";
import { applyRoomPreset } from "@/audio/SpatialAudioRenderer";

const Ctx = createContext<AudioPipeline | null>(null);

export function AudioPipelineProvider({ children }: { children: React.ReactNode }) {
  const pipeline = useRef(new AudioPipeline());
  const { speakerEnabled, roomPreset } = useAudioStore();

  useEffect(() => {
    pipeline.current.init().catch(console.error);
    return () => pipeline.current.destroy();
  }, []);

  useEffect(() => { pipeline.current.setSpeakerEnabled(speakerEnabled); }, [speakerEnabled]);
  useEffect(() => { applyRoomPreset(roomPreset); }, [roomPreset]);

  return <Ctx.Provider value={pipeline.current}>{children}</Ctx.Provider>;
}

export function useAudioPipeline() {
  return useContext(Ctx);
}
