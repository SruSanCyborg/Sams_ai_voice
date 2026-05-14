"use client";

import { useAudioStore } from "@/store/useAudioStore";
import { applyRoomPreset } from "@/audio/SpatialAudioRenderer";
import type { RoomPreset } from "@/types/spatial";

const PRESETS: { id: RoomPreset; label: string; emoji: string }[] = [
  { id: "studio",       label: "Studio",       emoji: "🎙️" },
  { id: "concert_hall", label: "Concert Hall",  emoji: "🎭" },
  { id: "cave",         label: "Cave",          emoji: "🦇" },
  { id: "outdoor",      label: "Outdoor",       emoji: "🌲" },
  { id: "bathroom",     label: "Bathroom",      emoji: "🚿" },
];

export function RoomPresetSelector() {
  const { roomPreset, setRoomPreset } = useAudioStore();
  const current = PRESETS.find((p) => p.id === roomPreset);

  function select(id: RoomPreset) {
    setRoomPreset(id);
    applyRoomPreset(id);
  }

  return (
    <div className="relative group">
      <button
        className="p-2.5 rounded-xl text-sm transition-all bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        style={roomPreset !== "studio" ? { background: "rgba(6,182,212,0.15)", color: "#22d3ee", boxShadow: "0 0 14px rgba(6,182,212,0.25)" } : undefined}
        title={`Room: ${current?.label}`}
      >
        {current?.emoji ?? "🎙️"}
      </button>

      <div
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-0.5 rounded-2xl p-2 min-w-[148px] z-50"
        style={{
          background: "rgba(10,10,26,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(6,182,212,0.12), 0 16px 40px rgba(0,0,0,0.7)",
        }}
      >
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1">Acoustics</p>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => select(preset.id)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all text-left"
            style={
              roomPreset === preset.id
                ? { background: "rgba(6,182,212,0.15)", color: "#22d3ee", borderLeft: "2px solid #06b6d4" }
                : { color: "#7c7c9a" }
            }
          >
            <span className="text-base">{preset.emoji}</span>
            <span className="font-medium">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
