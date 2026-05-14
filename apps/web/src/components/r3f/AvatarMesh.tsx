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
const SONAR_COUNT = 3;

export function AvatarMesh({ participant }: Props) {
  const meshRef = useRef<Mesh>(null);
  const orbitRef = useRef<Mesh>(null);
  const sonarRefs = useRef<(Mesh | null)[]>(Array(SONAR_COUNT).fill(null));
  const sonarPhases = useRef<number[]>([0, 0.34, 0.67]);
  const { camera, gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const isDragging = useRef(false);
  const updatePosition = useRoomStore((s) => s.updatePosition);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as any;

    if (participant.speaking) {
      // Emissive pulse tied to amplitude
      const targetEmissive = 0.35 + participant.amplitude * 1.6;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * Math.min(1, delta * 10);

      // Scale breathing — bigger with louder amplitude
      const targetScale = 1 + participant.amplitude * 0.2;
      const cs = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(cs + (targetScale - cs) * Math.min(1, delta * 14));

      // Sonar rings expand outward, speed up with amplitude
      const speed = 0.45 + participant.amplitude * 0.9;
      sonarRefs.current.forEach((ring, i) => {
        if (!ring) return;
        const phase = (sonarPhases.current[i] + delta * speed) % 1;
        sonarPhases.current[i] = phase;
        ring.scale.setScalar(1 + phase * 3.2);
        (ring.material as any).opacity = (1 - phase) * 0.6;
        ring.visible = true;
      });

      // Orbit ring spins fast
      if (orbitRef.current) {
        orbitRef.current.rotation.z += delta * (1.8 + participant.amplitude * 4);
        (orbitRef.current.material as any).opacity = Math.min(0.85, 0.5 + participant.amplitude);
      }
    } else {
      // Settle back to resting state
      mat.emissiveIntensity += (0.08 - mat.emissiveIntensity) * Math.min(1, delta * 5);
      const cs = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(cs + (1 - cs) * Math.min(1, delta * 7));

      // Idle sway
      meshRef.current.rotation.y += Math.sin(Date.now() * 0.0009) * 0.0006;

      // Sonar rings fade and hide
      sonarRefs.current.forEach((ring) => {
        if (!ring) return;
        (ring.material as any).opacity = Math.max(0, (ring.material as any).opacity - delta * 2);
        if ((ring.material as any).opacity <= 0) ring.visible = false;
      });

      // Orbit ring slow drift
      if (orbitRef.current) {
        orbitRef.current.rotation.z += delta * 0.25;
        (orbitRef.current.material as any).opacity += (0.18 - (orbitRef.current.material as any).opacity) * delta * 3;
      }
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
    updatePosition(participant.id, [
      Math.max(-9, Math.min(9, target.x)),
      0,
      Math.max(-9, Math.min(9, target.z)),
    ]);
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
      {/* Core body */}
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.4, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.08}
          metalness={0.45}
          roughness={0.3}
          transparent={!participant.speaking}
          opacity={participant.speaking ? 1 : 0.87}
          wireframe={hovered && !participant.isLocal}
        />
      </mesh>

      {/* Sonar pulse rings — expand outward from floor plane when speaking */}
      {Array.from({ length: SONAR_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { sonarRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.39, 0]}
          visible={false}
        >
          <ringGeometry args={[0.43, 0.54, 40]} />
          <meshBasicMaterial
            color={participant.color}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Orbit ring — tilted halo, spins faster when speaking */}
      <mesh ref={orbitRef} rotation={[Math.PI / 3.5, 0.4, 0]}>
        <ringGeometry args={[0.55, 0.60, 56]} />
        <meshBasicMaterial
          color={participant.color}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Local indicator dot */}
      {participant.isLocal && (
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}

      {/* Name label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0.88, 0]}
          fontSize={0.18}
          color={participant.isLocal ? "#22c55e" : "#e2e8f0"}
          anchorX="center"
          anchorY="middle"
        >
          {participant.name}{participant.isLocal ? " (you)" : ""}
        </Text>
      </Billboard>
    </group>
  );
}
