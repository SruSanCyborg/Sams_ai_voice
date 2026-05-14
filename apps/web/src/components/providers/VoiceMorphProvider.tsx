"use client";

import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useAudioStore } from "@/store/useAudioStore";
import { VoiceMorphPipeline } from "@/audio/VoiceMorphPipeline";

export function VoiceMorphProvider() {
  const { localParticipant } = useLocalParticipant();
  const voiceMorph = useAudioStore((s) => s.voiceMorph);
  const micEnabled = useAudioStore((s) => s.micEnabled);
  const pipelineRef = useRef<VoiceMorphPipeline | null>(null);

  useEffect(() => {
    if (!localParticipant) return;

    const pipeline = new VoiceMorphPipeline();
    pipelineRef.current = pipeline;

    pipeline
      .init()
      .then(async (stream) => {
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) return;
        await localParticipant.publishTrack(audioTrack, {
          source: Track.Source.Microphone,
          dtx: true,
        });
      })
      .catch((err) => console.error("[VoiceMorph] init failed:", err));

    return () => {
      pipeline.stop();
      pipelineRef.current = null;
    };
  }, [localParticipant?.sid]);

  useEffect(() => {
    pipelineRef.current?.applyPreset(voiceMorph);
  }, [voiceMorph]);

  useEffect(() => {
    pipelineRef.current?.setMicEnabled(micEnabled);
  }, [micEnabled]);

  return null;
}
