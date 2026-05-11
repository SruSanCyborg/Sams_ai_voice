"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useAudioPipeline } from "@/components/providers/AudioPipelineProvider";
import type { Vec3 } from "@/types/spatial";

export function HeadTracker() {
  const { camera } = useThree();
  const pipeline = useAudioPipeline();

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    if (
      typeof window !== "undefined" &&
      "DeviceOrientationEvent" in window
    ) {
      const handler = (e: DeviceOrientationEvent) => {
        if (!pipeline || e.alpha === null) return;
        const pos: Vec3 = [camera.position.x, camera.position.y, camera.position.z];
        pipeline.updateListenerPosition(pos);
      };

      window.addEventListener("deviceorientation", handler);
      cleanup = () => window.removeEventListener("deviceorientation", handler);
    }

    return () => cleanup?.();
  }, [camera, pipeline]);

  return null;
}
