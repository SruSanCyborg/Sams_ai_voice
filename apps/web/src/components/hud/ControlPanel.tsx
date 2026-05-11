"use client";

import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Volume2, VolumeX, Subtitles, Circle,
  Accessibility, LogOut, Music, Waves
} from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";
import { MorphSelector } from "./MorphSelector";
import { RoomPresetSelector } from "./RoomPresetSelector";
import { useSpatialRecorder } from "@/hooks/useSpatialRecorder";

interface Props {
  roomId: string;
}

export function ControlPanel({ roomId }: Props) {
  const router = useRouter();
  const {
    micEnabled, setMic,
    speakerEnabled, setSpeaker,
    captionsEnabled, setCaptions,
    accessibilityMode, setAccessibility,
    musicEnabled, setMusicEnabled,
  } = useAudioStore();
  const { isRecording, toggle: toggleRecording } = useSpatialRecorder();

  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2 shadow-2xl shadow-black/50">
      {/* Mic */}
      <IconButton
        active={micEnabled}
        onClick={() => setMic(!micEnabled)}
        activeIcon={<Mic className="w-4 h-4" />}
        inactiveIcon={<MicOff className="w-4 h-4" />}
        tooltip={micEnabled ? "Mute" : "Unmute"}
        dangerWhenInactive
      />

      {/* Speaker */}
      <IconButton
        active={speakerEnabled}
        onClick={() => setSpeaker(!speakerEnabled)}
        activeIcon={<Volume2 className="w-4 h-4" />}
        inactiveIcon={<VolumeX className="w-4 h-4" />}
        tooltip={speakerEnabled ? "Deafen" : "Undeafen"}
        dangerWhenInactive
      />

      <Divider />

      {/* Voice morph */}
      <MorphSelector />

      {/* Room preset */}
      <RoomPresetSelector />

      <Divider />

      {/* Captions */}
      <IconButton
        active={captionsEnabled}
        onClick={() => setCaptions(!captionsEnabled)}
        activeIcon={<Subtitles className="w-4 h-4" />}
        inactiveIcon={<Subtitles className="w-4 h-4 opacity-40" />}
        tooltip="Toggle captions"
      />

      {/* Music */}
      <IconButton
        active={musicEnabled}
        onClick={() => setMusicEnabled(!musicEnabled)}
        activeIcon={<Music className="w-4 h-4" />}
        inactiveIcon={<Music className="w-4 h-4 opacity-40" />}
        tooltip="Spatial music"
      />

      {/* Record */}
      <button
        onClick={toggleRecording}
        title={isRecording ? "Stop recording" : "Record spatial session"}
        className={`p-2.5 rounded-xl transition-all ${
          isRecording
            ? "bg-red-500/20 text-red-400 animate-pulse"
            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Circle className={`w-4 h-4 ${isRecording ? "fill-current" : ""}`} />
      </button>

      {/* Accessibility */}
      <IconButton
        active={accessibilityMode}
        onClick={() => setAccessibility(!accessibilityMode)}
        activeIcon={<Accessibility className="w-4 h-4" />}
        inactiveIcon={<Accessibility className="w-4 h-4 opacity-40" />}
        tooltip="Visual accessibility mode"
      />

      <Divider />

      {/* Leave */}
      <button
        onClick={() => router.push("/")}
        title="Leave room"
        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

interface IconButtonProps {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  tooltip: string;
  dangerWhenInactive?: boolean;
}

function IconButton({
  active,
  onClick,
  activeIcon,
  inactiveIcon,
  tooltip,
  dangerWhenInactive,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`p-2.5 rounded-xl transition-all ${
        active
          ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
          : dangerWhenInactive
          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
