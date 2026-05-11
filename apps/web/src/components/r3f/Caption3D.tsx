"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import type { Caption } from "@/types/room";
import type { Vec3 } from "@/types/spatial";

interface Props {
  caption: Caption;
  position: Vec3;
}

export function Caption3D({ caption, position }: Props) {
  const opacity = useRef(0);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    // Fade in for 0.2s, hold for 3s, fade out for 0.5s
    if (age.current < 0.2) {
      opacity.current = age.current / 0.2;
    } else if (age.current < 3.2) {
      opacity.current = 1;
    } else {
      opacity.current = Math.max(0, 1 - (age.current - 3.2) / 0.5);
    }
  });

  return (
    <Billboard
      follow
      position={[position[0], position[1] + 1.2, position[2]]}
    >
      <Text
        fontSize={0.14}
        maxWidth={3}
        textAlign="center"
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#0a0a1a"
      >
        {caption.text}
      </Text>
    </Billboard>
  );
}
