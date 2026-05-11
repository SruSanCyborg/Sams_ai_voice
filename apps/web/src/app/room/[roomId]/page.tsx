"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LiveKitProvider } from "@/components/providers/LiveKitProvider";
import { AudioPipelineProvider } from "@/components/providers/AudioPipelineProvider";
import { Scene } from "@/components/r3f/Scene";
import { ControlPanel } from "@/components/hud/ControlPanel";
import { UserList } from "@/components/hud/UserList";
import { RecordingBadge } from "@/components/hud/RecordingBadge";
import { AccessibilityHUD } from "@/components/hud/AccessibilityHUD";
import { WhisperBubble } from "@/components/hud/WhisperBubble";
import { useRoomStore } from "@/store/useRoomStore";
import { useAudioStore } from "@/store/useAudioStore";

function RoomInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userName = searchParams.get("name") ?? "Anonymous";
  const { accessibilityMode, isRecording } = useAudioStore();

  return (
    <LiveKitProvider roomId={roomId} userName={userName}>
      <AudioPipelineProvider>
        <div className="fixed inset-0 bg-space-900">
          {/* Full-screen 3D canvas */}
          <Scene />

          {/* HTML overlay */}
          <div className="fixed inset-0 pointer-events-none">
            {/* Top bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white">{roomId}</span>
                <span className="text-xs text-slate-400">• {userName}</span>
              </div>
              {isRecording && <RecordingBadge />}
            </div>

            {/* Right sidebar — participants */}
            <div className="absolute right-4 top-20 bottom-24 pointer-events-auto">
              <UserList />
            </div>

            {/* Whisper bubble (proximity) */}
            <WhisperBubble />

            {/* Accessibility HUD (bottom-left) */}
            {accessibilityMode && (
              <div className="absolute bottom-24 left-4 pointer-events-auto">
                <AccessibilityHUD />
              </div>
            )}

            {/* Bottom control bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <ControlPanel roomId={roomId} />
            </div>
          </div>
        </div>
      </AudioPipelineProvider>
    </LiveKitProvider>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-violet-400 text-sm animate-pulse">Joining room...</div>
      </div>
    }>
      <RoomInner />
    </Suspense>
  );
}
