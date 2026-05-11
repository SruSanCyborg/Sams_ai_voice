"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from "three";
import type { Participant } from "@/types/room";
import { EMOTION_COLORS } from "@/types/spatial";

interface Props {
  participant: Participant;
}

export function EmotionAura({ participant }: Props) {
  const pointsRef = useRef<Points>(null);

  const { positions } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.5 + Math.random() * 0.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return { positions: pos };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    pointsRef.current.rotation.y = t * 0.3;
    pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    // Pulsate scale with speaking
    const targetScale = participant.speaking ? 1 + participant.amplitude * 0.5 : 0.8;
    const s = pointsRef.current.scale.x + (targetScale - pointsRef.current.scale.x) * 0.1;
    pointsRef.current.scale.setScalar(s);
  });

  const color = EMOTION_COLORS[participant.emotion] ?? "#94a3b8";
  const visible = participant.emotion !== "neutral" || participant.speaking;

  if (!visible) return null;

  return (
    <group position={participant.position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={color}
          transparent
          opacity={participant.speaking ? 0.8 : 0.3}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
