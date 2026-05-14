"use client";

import { useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Plane, Raycaster, Vector3 } from "three";
import { useAudioStore } from "@/store/useAudioStore";
import { useRoomStore } from "@/store/useRoomStore";
import type { Vec3 } from "@/types/spatial";

const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0);

function dist2D(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

export function SoundBubble() {
  const bubbleActive = useAudioStore((s) => s.bubbleActive);
  const bubblePosition = useAudioStore((s) => s.bubblePosition);
  const bubbleRadius = useAudioStore((s) => s.bubbleRadius);
  const setBubblePosition = useAudioStore((s) => s.setBubblePosition);

  const localPosition = useRoomStore((s) => {
    const p = s.localId ? s.participants.get(s.localId) : undefined;
    return (p?.position ?? [0, 0, 0]) as Vec3;
  });

  const outerRef = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();
  const isDragging = useRef(false);

  const isLocalInside = dist2D(localPosition, bubblePosition) <= bubbleRadius;
  const color = isLocalInside ? "#06b6d4" : "#7c3aed";

  useFrame((_, delta) => {
    if (!outerRef.current || !innerRef.current) return;
    outerRef.current.rotation.y += delta * 0.08;
    innerRef.current.rotation.y -= delta * 0.05;
    innerRef.current.rotation.x += delta * 0.03;
  });

  const onPointerDown = useCallback((e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    gl.domElement.style.cursor = "grabbing";
  }, [gl]);

  const onPointerMove = useCallback((e: any) => {
    if (!isDragging.current) return;
    const ray = new Raycaster();
    const hit = new Vector3();
    ray.setFromCamera(e.pointer, camera);
    ray.ray.intersectPlane(FLOOR_PLANE, hit);
    setBubblePosition([
      Math.max(-8, Math.min(8, hit.x)),
      0,
      Math.max(-8, Math.min(8, hit.z)),
    ]);
  }, [camera, setBubblePosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    gl.domElement.style.cursor = "auto";
  }, [gl]);

  if (!bubbleActive) return null;

  return (
    <group
      position={bubblePosition}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Translucent outer fill */}
      <mesh>
        <sphereGeometry args={[bubbleRadius, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Wireframe shell — slowly rotates */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[bubbleRadius, 14, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} wireframe />
      </mesh>

      {/* Inner sphere — counter-rotates for depth */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[bubbleRadius * 0.65, 10, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} wireframe depthWrite={false} />
      </mesh>

      {/* Floor ring to show placement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[bubbleRadius - 0.05, bubbleRadius + 0.05, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Center drag handle */}
      <mesh>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Label */}
      {/* Using a simple indicator — no Text import needed */}
    </group>
  );
}
