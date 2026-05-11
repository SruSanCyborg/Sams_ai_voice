"use client";

import { useAudioStore } from "@/store/useAudioStore";
import type { RoomPreset } from "@/types/spatial";

const PRESETS: { id: RoomPreset; label: string; emoji: string }[] = [
  { id: "studio", label: "Studio", emoji: "🎙️" },
  { id: "concert_hall", label: "Concert Hall", emoji: "🎭" },
  { id: "cave", label: "Cave", emoji: "🦇" },
  { id: "outdoor", label: "Outdoor", emoji: "🌲" },
  { id: "bathroom", label: "Bathroom", emoji: "🚿" },
];

export function RoomPresetSelector() {
  const { roomPreset, setRoomPreset } = useAudioStore();

  return (
    <div className="relative group">
      <button
        className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-sm"
        title="Room acoustics"
      >
        {PRESETS.find((p) => p.id === roomPreset)?.emoji ?? "🎙️"}
      </button>

      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-1 glass rounded-xl p-2 min-w-[140px] shadow-xl z-50">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setRoomPreset(preset.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              roomPreset === preset.id
                ? "bg-violet-500/30 text-violet-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{preset.emoji}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
