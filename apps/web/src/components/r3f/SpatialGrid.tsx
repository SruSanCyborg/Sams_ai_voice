"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GridHelper, Mesh } from "three";

export function SpatialGrid() {
  return (
    <group>
      {/* Main floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[20, 20, "#7c3aed22", "#3b82f611"]} />

      {/* Center marker */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
