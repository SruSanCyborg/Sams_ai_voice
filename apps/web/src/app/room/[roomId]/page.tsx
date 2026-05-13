"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { LiveKitProvider } from "@/components/providers/LiveKitProvider";
import { AudioPipelineProvider, useAudioPipeline } from "@/components/providers/AudioPipelineProvider";
import { Scene } from "@/components/r3f/Scene";
import { ControlPanel } from "@/components/hud/ControlPanel";
import { UserList } from "@/components/hud/UserList";
import { RecordingBadge } from "@/components/hud/RecordingBadge";
import { AccessibilityHUD } from "@/components/hud/AccessibilityHUD";
import { WhisperBubble } from "@/components/hud/WhisperBubble";
import { useAudioStore } from "@/store/useAudioStore";
import { Copy, Check, Volume2 } from "lucide-react";

function AudioActivator() {
  const pipeline = useAudioPipeline();
  const [activated, setActivated] = useState(false);

  const activate = useCallback(() => {
    pipeline?.resume();
    setActivated(true);
  }, [pipeline]);

  if (activated) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
      onClick={activate}
    >
      <div className="glass rounded-2xl px-8 py-6 text-center max-w-xs">
        <Volume2 className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <p className="text-white font-semibold text-lg mb-1">Click to activate audio</p>
        <p className="text-slate-400 text-sm">Browsers require a click before spatial audio can play</p>
      </div>
    </div>
  );
}

function RoomInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userName = searchParams.get("name") ?? "Anonymous";
  const { accessibilityMode, isRecording } = useAudioStore();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <LiveKitProvider roomId={roomId} userName={userName}>
      <AudioActivator />
      <div className="fixed inset-0 bg-space-900">
        <Scene />

        <div className="fixed inset-0 pointer-events-none">
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <span className="text-sm font-mono font-bold text-white tracking-widest">{roomId}</span>
                <span className="text-xs text-slate-400 ml-2">· {userName}</span>
              </div>
              <button
                onClick={copyLink}
                title="Copy invite link"
                className="ml-1 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {isRecording && <RecordingBadge />}
          </div>

          {/* Right sidebar */}
          <div className="absolute right-4 top-20 bottom-24 pointer-events-auto">
            <UserList />
          </div>

          <WhisperBubble />

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
      <AudioPipelineProvider>
        <RoomInner />
      </AudioPipelineProvider>
    </Suspense>
  );
}
