"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { AudioPipeline } from "@/audio/pipeline/AudioPipeline";
import { useRoomStore } from "@/store/useRoomStore";
import { useAudioStore } from "@/store/useAudioStore";

const Ctx = createContext<AudioPipeline | null>(null);

export function AudioPipelineProvider({ children }: { children: React.ReactNode }) {
  const pipeline = useRef(new AudioPipeline());
  const { micEnabled, speakerEnabled, roomPreset } = useAudioStore();

  // Init / destroy
  useEffect(() => {
    const p = pipeline.current;
    p.init().catch(console.error);
    return () => p.destroy();
  }, []);

  // Wire speaking + emotion callbacks after localId is set
  useEffect(() => {
    return useRoomStore.subscribe((state) => {
      const p = pipeline.current;

      p.onSpeaking = (speaking, amplitude) => {
        if (state.localId) state.updateSpeaking(state.localId, speaking, amplitude);
      };
      p.onEmotion = (emotion) => {
        if (state.localId) state.updateEmotion(state.localId, emotion as any);
      };

      // Sync every remote participant's position to the audio pipeline
      state.participants.forEach((participant) => {
        if (!participant.isLocal) {
          p.updateParticipantPosition(participant.id, participant.position);
        }
      });

      // Update listener (local) position
      const local = state.localId ? state.participants.get(state.localId) : null;
      if (local) p.updateListenerPosition(local.position);
    });
  }, []);

  // Controls
  useEffect(() => { pipeline.current.setMicEnabled(micEnabled); }, [micEnabled]);
  useEffect(() => { pipeline.current.setSpeakerEnabled(speakerEnabled); }, [speakerEnabled]);
  useEffect(() => { pipeline.current.setRoomPreset(roomPreset); }, [roomPreset]);

  return <Ctx.Provider value={pipeline.current}>{children}</Ctx.Provider>;
}

export function useAudioPipeline() {
  return useContext(Ctx);
}
