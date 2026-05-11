"use client";

import { useRef, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { Mesh, Color, Plane, Raycaster, Vector3 } from "three";
import type { Participant } from "@/types/room";
import { useRoomStore } from "@/store/useRoomStore";

interface Props {
  participant: Participant;
}

const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0);

export function AvatarMesh({ participant }: Props) {
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const isDragging = useRef(false);
  const updatePosition = useRoomStore((s) => s.updatePosition);

  // Pulse emissive intensity based on VAD amplitude
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = (meshRef.current.material as any);
    const target = participant.speaking ? 0.3 + participant.amplitude * 1.2 : 0.1;
    mat.emissiveIntensity = mat.emissiveIntensity + (target - mat.emissiveIntensity) * Math.min(1, delta * 8);

    // Idle body sway
    if (!participant.speaking) {
      meshRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.0005;
    }
  });

  const onPointerDown = useCallback((e: any) => {
    if (!participant.isLocal) return;
    e.stopPropagation();
    isDragging.current = true;
    gl.domElement.style.cursor = "grabbing";
  }, [participant.isLocal, gl]);

  const onPointerMove = useCallback((e: any) => {
    if (!isDragging.current || !participant.isLocal) return;
    const ray = new Raycaster();
    const target = new Vector3();
    ray.setFromCamera(e.pointer, camera);
    ray.ray.intersectPlane(FLOOR_PLANE, target);
    const clamped: [number, number, number] = [
      Math.max(-9, Math.min(9, target.x)),
      0,
      Math.max(-9, Math.min(9, target.z)),
    ];
    updatePosition(participant.id, clamped);
  }, [participant, camera, updatePosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    gl.domElement.style.cursor = "auto";
  }, [gl]);

  const color = new Color(participant.color);

  return (
    <group
      position={participant.position}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); isDragging.current = false; }}
    >
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.4, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.4}
          transparent={participant.speaking ? false : true}
          opacity={participant.speaking ? 1 : 0.85}
          wireframe={hovered && !participant.isLocal}
        />
      </mesh>

      {/* Speaking ring */}
      {participant.speaking && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={participant.color} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Local indicator */}
      {participant.isLocal && (
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}

      {/* Name label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0.75, 0]}
          fontSize={0.18}
          color={participant.isLocal ? "#22c55e" : "#e2e8f0"}
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.woff"
        >
          {participant.name}
          {participant.isLocal ? " (you)" : ""}
        </Text>
      </Billboard>
    </group>
  );
}
