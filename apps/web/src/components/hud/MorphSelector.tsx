"use client";

import { useAudioStore } from "@/store/useAudioStore";
import type { VoiceMorphPreset } from "@/types/spatial";

const PRESETS: { id: VoiceMorphPreset; label: string; emoji: string }[] = [
  { id: "none", label: "Normal", emoji: "🎤" },
  { id: "robot", label: "Robot", emoji: "🤖" },
  { id: "chipmunk", label: "Chipmunk", emoji: "🐿️" },
  { id: "deep", label: "Deep", emoji: "😈" },
  { id: "radio", label: "Radio", emoji: "📻" },
  { id: "echo", label: "Echo", emoji: "🔊" },
];

export function MorphSelector() {
  const { voiceMorph, setVoiceMorph } = useAudioStore();

  return (
    <div className="relative group">
      <button
        className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-sm"
        title="Voice morph"
      >
        {PRESETS.find((p) => p.id === voiceMorph)?.emoji ?? "🎤"}
      </button>

      {/* Dropdown */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-1 glass rounded-xl p-2 min-w-[120px] shadow-xl z-50">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setVoiceMorph(preset.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              voiceMorph === preset.id
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
