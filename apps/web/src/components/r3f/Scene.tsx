"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { Suspense } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { AvatarMesh } from "./AvatarMesh";
import { Caption3D } from "./Caption3D";
import { SpatialGrid } from "./SpatialGrid";
import { RoomPreset } from "./RoomPreset";
import { HeadTracker } from "./HeadTracker";
import { EmotionAura } from "./EmotionAura";

function SceneContent() {
  const participants = useRoomStore((s) => [...s.participants.values()]);
  const captions = useRoomStore((s) => s.captions);

  return (
    <>
      {/* Lighting */}
      <ambientLight color="#1a1a2e" intensity={0.6} />
      <pointLight position={[0, 3, 0]} color="#7c3aed" intensity={1.5} distance={20} />
      <spotLight position={[-6, 5, 4]} color="#3b82f6" intensity={0.8} angle={0.5} penumbra={0.5} />
      <spotLight position={[6, 5, -4]} color="#06b6d4" intensity={0.8} angle={0.5} penumbra={0.5} />

      {/* Environment */}
      <Stars radius={60} depth={40} count={3000} factor={2} fade speed={0.5} />
      <SpatialGrid />
      <RoomPreset />

      {/* Avatars */}
      {participants.map((p) => (
        <group key={p.id}>
          <AvatarMesh participant={p} />
          <EmotionAura participant={p} />
        </group>
      ))}

      {/* Floating captions */}
      {captions.slice(-3).map((c) => {
        const p = participants.find((x) => x.id === c.participantId);
        if (!p) return null;
        return <Caption3D key={c.id} caption={c} position={p.position} />;
      })}

      <HeadTracker />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} intensity={0.8} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 4, 8], fov: 60, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      frameloop="demand"
      style={{ background: "#0a0a1a" }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
