"use client";

import { useAudioStore } from "@/store/useAudioStore";
import type { VoiceMorphPreset } from "@/types/spatial";

const PRESETS: { id: VoiceMorphPreset; label: string; emoji: string }[] = [
  { id: "none",     label: "Normal",   emoji: "🎤" },
  { id: "robot",    label: "Robot",    emoji: "🤖" },
  { id: "chipmunk", label: "Chipmunk", emoji: "🐿️" },
  { id: "deep",     label: "Deep",     emoji: "😈" },
  { id: "radio",    label: "Radio",    emoji: "📻" },
  { id: "echo",     label: "Echo",     emoji: "🔊" },
];

export function MorphSelector() {
  const { voiceMorph, setVoiceMorph } = useAudioStore();
  const current = PRESETS.find((p) => p.id === voiceMorph);

  return (
    <div className="relative group">
      <button
        className="p-2.5 rounded-xl text-sm transition-all bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        style={voiceMorph !== "none" ? { background: "rgba(124,58,237,0.2)", color: "#a78bfa", boxShadow: "0 0 14px rgba(124,58,237,0.3)" } : undefined}
        title={`Voice: ${current?.label}`}
      >
        {current?.emoji ?? "🎤"}
      </button>

      <div
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-0.5 rounded-2xl p-2 min-w-[132px] z-50"
        style={{
          background: "rgba(10,10,26,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(124,58,237,0.15), 0 16px 40px rgba(0,0,0,0.7)",
        }}
      >
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-1">Voice FX</p>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setVoiceMorph(preset.id)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all text-left"
            style={
              voiceMorph === preset.id
                ? { background: "rgba(124,58,237,0.2)", color: "#a78bfa", borderLeft: "2px solid #7c3aed" }
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
