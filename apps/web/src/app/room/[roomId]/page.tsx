"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { LiveKitRoom } from "@livekit/components-react";
import { motion } from "framer-motion";
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
// Audio activation overlay
// ─────────────────────────────────────────────────────────────────────────────
function AudioActivator() {
  const [activated, setActivated] = useState(false);
  if (activated) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: "rgba(5,5,20,0.85)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => { resumeAudioCtx(); setActivated(true); }}
    >
      <motion.div
        className="glass rounded-3xl px-10 py-8 text-center max-w-sm mx-4"
        style={{ boxShadow: "0 0 0 1px rgba(124,58,237,0.25), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.1)" }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* Pulsing mic orb */}
        <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-violet-500/40 animate-sonar" />
          <span className="absolute inset-0 rounded-full border border-violet-500/25 animate-sonar-d1" />
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-white font-bold text-xl mb-1.5">Tap to enter</p>
        <p className="text-slate-400 text-sm">Browsers require one click before spatial audio plays</p>
        <div className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold inline-block shadow-lg shadow-violet-500/30">
          Activate Spatial Audio →
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room UI
// ─────────────────────────────────────────────────────────────────────────────
function RoomContent({ roomId, userName }: { roomId: string; userName: string }) {
  const { accessibilityMode, isRecording } = useAudioStore();
  const participantCount = useRoomStore((s) => s.participants.size);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ease = [0.16, 1, 0.3, 1] as const;

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

          {/* ── Top bar ─────────────────────────────────────────────────────── */}
          <motion.div
            className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <div
              className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3"
              style={{ boxShadow: "0 0 0 1px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.5)" }}
            >
              {/* Animated live dot */}
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />
              </div>

              {/* Room code */}
              <span
                className="text-sm font-mono font-black tracking-[0.22em] select-all"
                style={{ color: "#e8e8f0" }}
              >
                {roomId}
              </span>

              <div className="w-px h-4 bg-white/10" />

              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-slate-300 font-medium truncate max-w-[100px]">{userName}</span>
              </div>

              {/* Participant count */}
              <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">
                {participantCount} in room
              </span>

              {/* Copy link */}
              <button
                onClick={copyLink}
                title="Copy invite link"
                className="p-1 rounded-lg bg-white/5 hover:bg-violet-500/20 text-slate-500 hover:text-violet-300 transition-all flex-shrink-0"
              >
                {copied
                  ? <Check className="w-3 h-3 text-green-400" />
                  : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {isRecording && <RecordingBadge />}
          </motion.div>

          {/* ── Right: participants ─────────────────────────────────────────── */}
          <motion.div
            className="absolute right-4 top-20 bottom-24 pointer-events-auto"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
          >
            <UserList />
          </motion.div>

          {/* ── Whisper notification ────────────────────────────────────────── */}
          <WhisperBubble />

          {accessibilityMode && (
            <div className="absolute bottom-24 left-4 pointer-events-auto">
              <AccessibilityHUD />
            </div>
          )}

          {/* ── Bottom: controls ───────────────────────────────────────────── */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
          >
            <HelpCard />
            <ControlPanel roomId={roomId} />
          </motion.div>
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
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <span className="absolute inset-0 rounded-full border border-violet-500/50 animate-sonar" />
            <span className="absolute inset-0 rounded-full border border-violet-500/30 animate-sonar-d1" />
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
            </div>
          </div>
          <p className="text-violet-400 text-sm animate-pulse">Connecting to {roomId}…</p>
        </div>
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
