"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Volume2, VolumeX, Subtitles, Circle,
  Accessibility, LogOut, Music, Brain, Loader2, Globe,
} from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";
import { useRoomStore } from "@/store/useRoomStore";
import { getAudioCtx } from "@/audio/SpatialAudioRenderer";
import { MorphSelector } from "./MorphSelector";
import { RoomPresetSelector } from "./RoomPresetSelector";
import { useSpatialRecorder } from "@/hooks/useSpatialRecorder";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://web-production-99e58.up.railway.app";

interface Props { roomId: string; }

export function ControlPanel({ roomId }: Props) {
  const router = useRouter();
  const {
    micEnabled, setMic,
    speakerEnabled, setSpeaker,
    captionsEnabled, setCaptions,
    accessibilityMode, setAccessibility,
    musicEnabled, setMusicEnabled,
    bubbleActive, setBubbleActive,
  } = useAudioStore();
  const { isRecording, toggle: toggleRecording } = useSpatialRecorder();

  function toggleMic() {
    setMic(!micEnabled);
    // VoiceMorphProvider reacts to micEnabled store change and mutes the track
  }

  function toggleSpeaker() {
    const next = !speakerEnabled;
    setSpeaker(next);
    // Suspend/resume the shared AudioContext so all spatial tracks go silent
    try {
      const ctx = getAudioCtx();
      if (next) ctx.resume().catch(() => {});
      else ctx.suspend().catch(() => {});
    } catch {}
  }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function runModerator() {
    if (!BACKEND) { setAiError("No backend URL set"); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const participants = [...useRoomStore.getState().participants.values()].map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        speaking: p.speaking,
      }));
      const res = await fetch(`${BACKEND}/moderator/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, participants, speaking_history: [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const updatePosition = useRoomStore.getState().updatePosition;
      (data.suggestions ?? []).forEach((s: { participant_id: string; suggested_position: [number, number, number] }) => {
        updatePosition(s.participant_id, s.suggested_position);
      });
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {aiError && (
        <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-lg">{aiError}</div>
      )}
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2 shadow-2xl shadow-black/50">
        {/* Mic */}
        <Btn active={micEnabled} onClick={toggleMic}
          activeIcon={<Mic className="w-4 h-4" />} inactiveIcon={<MicOff className="w-4 h-4" />}
          tooltip={micEnabled ? "Mute" : "Unmute"} danger={!micEnabled} />

        {/* Speaker */}
        <Btn active={speakerEnabled} onClick={toggleSpeaker}
          activeIcon={<Volume2 className="w-4 h-4" />} inactiveIcon={<VolumeX className="w-4 h-4" />}
          tooltip={speakerEnabled ? "Deafen" : "Undeafen"} danger={!speakerEnabled} />

        <Div />

        <MorphSelector />
        <RoomPresetSelector />

        <Div />

        {/* Captions */}
        <Btn active={captionsEnabled} onClick={() => setCaptions(!captionsEnabled)}
          activeIcon={<Subtitles className="w-4 h-4" />} inactiveIcon={<Subtitles className="w-4 h-4 opacity-40" />}
          tooltip="Toggle captions" />

        {/* AI Moderator */}
        <button
          onClick={runModerator}
          disabled={aiLoading}
          title="AI Moderator — auto-arrange spatial positions"
          className={`p-2.5 rounded-xl transition-all ${
            aiLoading
              ? "bg-cyan-500/20 text-cyan-400 cursor-wait"
              : "bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300"
          }`}
        >
          {aiLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Brain className="w-4 h-4" />}
        </button>

        {/* Music */}
        <Btn active={musicEnabled} onClick={() => setMusicEnabled(!musicEnabled)}
          activeIcon={<Music className="w-4 h-4" />} inactiveIcon={<Music className="w-4 h-4 opacity-40" />}
          tooltip="Spatial music" />

        {/* Sound Bubble Zone */}
        <Btn active={bubbleActive} onClick={() => setBubbleActive(!bubbleActive)}
          activeIcon={<Globe className="w-4 h-4" />} inactiveIcon={<Globe className="w-4 h-4 opacity-40" />}
          tooltip={bubbleActive ? "Deactivate sound bubble" : "Activate sound bubble zone"} />

        {/* Record */}
        <button onClick={toggleRecording} title={isRecording ? "Stop recording" : "Record"}
          className={`p-2.5 rounded-xl transition-all ${isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}>
          <Circle className={`w-4 h-4 ${isRecording ? "fill-current" : ""}`} />
        </button>

        {/* Accessibility */}
        <Btn active={accessibilityMode} onClick={() => setAccessibility(!accessibilityMode)}
          activeIcon={<Accessibility className="w-4 h-4" />} inactiveIcon={<Accessibility className="w-4 h-4 opacity-40" />}
          tooltip="Accessibility" />

        <Div />

        {/* Leave */}
        <button onClick={() => router.push("/")} title="Leave"
          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Div() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

function Btn({ active, onClick, activeIcon, inactiveIcon, tooltip, danger }: {
  active: boolean; onClick: () => void;
  activeIcon: React.ReactNode; inactiveIcon: React.ReactNode;
  tooltip: string; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={tooltip}
      className={`p-2.5 rounded-xl transition-all ${
        active ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
          : danger ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}>
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
