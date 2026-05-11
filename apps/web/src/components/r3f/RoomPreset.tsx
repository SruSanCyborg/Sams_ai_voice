"use client";

import { useAudioStore } from "@/store/useAudioStore";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function StudioRoom() {
  return (
    <group>
      <mesh position={[0, 3, -9]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#111118" roughness={0.9} />
      </mesh>
    </group>
  );
}

function ConcertHallRoom() {
  return (
    <group>
      {/* Columns */}
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} position={[x, 1.5, -8]}>
          <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
          <meshStandardMaterial color="#2d2d4a" metalness={0.3} />
        </mesh>
      ))}
      {/* Arch ceiling hint */}
      <mesh position={[0, 5, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[8, 0.3, 8, 40, Math.PI]} />
        <meshStandardMaterial color="#1a1a3a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function CaveRoom() {
  return (
    <group>
      {/* Stalactites */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (Math.sin(i * 2.3) * 7);
        const z = (Math.cos(i * 1.7) * 6);
        const h = 1 + Math.random() * 2;
        return (
          <mesh key={i} position={[x, 4, z]}>
            <coneGeometry args={[0.15, h, 5]} />
            <meshStandardMaterial color="#2a1a0a" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function OutdoorRoom() {
  return (
    <group>
      {/* Sky gradient hint */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[40, 16, 8]} />
        <meshBasicMaterial color="#060d1a" side={1} />
      </mesh>
      {/* Stars are in Scene.tsx */}
    </group>
  );
}

const ROOMS: Record<string, React.ComponentType> = {
  studio: StudioRoom,
  concert_hall: ConcertHallRoom,
  cave: CaveRoom,
  outdoor: OutdoorRoom,
  bathroom: StudioRoom,
};

export function RoomPreset() {
  const preset = useAudioStore((s) => s.roomPreset);
  const RoomComponent = ROOMS[preset] ?? StudioRoom;
  return <RoomComponent />;
}
