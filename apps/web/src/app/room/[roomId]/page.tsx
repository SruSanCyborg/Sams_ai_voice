"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { LiveKitRoom } from "@livekit/components-react";
import { AudioPipelineProvider } from "@/components/providers/AudioPipelineProvider";
import { LiveKitBridge } from "@/components/providers/LiveKitBridge";
import { VoiceMorphProvider } from "@/components/providers/VoiceMorphProvider";
import { CaptionsProvider } from "@/components/providers/CaptionsProvider";
import { SpatialMusicPlayer } from "@/components/providers/SpatialMusicPlayer";
import { SpatialAudioRenderer, resumeAudioCtx } from "@/audio/SpatialAudioRenderer";
import { Scene } from "@/components/r3f/Scene";
import { ControlPanel } from "@/components/hud/ControlPanel";
import { UserList } from "@/components/hud/UserList";
import { RecordingBadge } from "@/components/hud/RecordingBadge";
import { AccessibilityHUD } from "@/components/hud/AccessibilityHUD";
import { WhisperBubble } from "@/components/hud/WhisperBubble";
import { useAudioStore } from "@/store/useAudioStore";
import { useRoomStore } from "@/store/useRoomStore";
import { HelpCard } from "@/components/hud/HelpCard";
import { Copy, Check, Volume2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Audio activation overlay — browser requires a user gesture before Web Audio
// ─────────────────────────────────────────────────────────────────────────────
function AudioActivator() {
  const [activated, setActivated] = useState(false);
  if (activated) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
      onClick={() => { resumeAudioCtx(); setActivated(true); }}
    >
      <div className="glass rounded-2xl px-8 py-6 text-center max-w-sm mx-4">
        <Volume2 className="w-12 h-12 text-violet-400 mx-auto mb-3" />
        <p className="text-white font-bold text-xl mb-2">Click to activate spatial audio</p>
        <p className="text-slate-400 text-sm">Browsers require one click before audio can play</p>
        <div className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-block">
          Tap anywhere →
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The actual room UI — rendered inside LiveKitRoom context
// ─────────────────────────────────────────────────────────────────────────────
function RoomContent({ roomId, userName }: { roomId: string; userName: string }) {
  const { accessibilityMode, isRecording } = useAudioStore();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AudioPipelineProvider>
      <AudioActivator />
      <SpatialAudioRenderer />
      <LiveKitBridge userName={userName} />
      <VoiceMorphProvider />
      <CaptionsProvider roomId={roomId} />
      <SpatialMusicPlayer />

      <div className="fixed inset-0 bg-space-900">
        <Scene />

        <div className="fixed inset-0 pointer-events-none">
          {/* Top bar: room code + copy */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-mono font-bold text-white tracking-widest">{roomId}</span>
              <span className="text-xs text-slate-400">· {userName}</span>
              <button
                onClick={copyLink}
                title="Copy invite link"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {isRecording && <RecordingBadge />}
          </div>

          {/* Right: participants */}
          <div className="absolute right-4 top-20 bottom-24 pointer-events-auto">
            <UserList />
          </div>

          <WhisperBubble />

          {accessibilityMode && (
            <div className="absolute bottom-24 left-4 pointer-events-auto">
              <AccessibilityHUD />
            </div>
          )}

          {/* Bottom: controls + help */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <HelpCard />
            <ControlPanel roomId={roomId} />
          </div>
        </div>
      </div>
    </AudioPipelineProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Token fetch + LiveKitRoom wrapper
// ─────────────────────────────────────────────────────────────────────────────
function RoomInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (params.roomId as string).toUpperCase();
  const userName = searchParams.get("name") ?? "Anonymous";
  const resetRoom = useRoomStore((s) => s.resetRoom);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resetRoom();

    fetch("/api/livekit-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, participantName: userName }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setToken(d.token);
      })
      .catch((e) => setError(e.message));

    return () => resetRoom();
  }, [roomId, userName]);

  if (error) {
    return (
      <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Failed to join: {error}</p>
        <button onClick={() => router.push("/")} className="text-sm text-slate-400 underline">← Back</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-violet-400 text-sm animate-pulse">Connecting to room {roomId}…</div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      audio={false}
      video={false}
      onDisconnected={() => router.push("/")}
    >
      <RoomContent roomId={roomId} userName={userName} />
    </LiveKitRoom>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-violet-400 text-sm animate-pulse">Loading…</div>
      </div>
    }>
      <RoomInner />
    </Suspense>
  );
}
