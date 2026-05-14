"use client";

import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "🎤", label: "Mic", desc: "Mute / unmute your mic" },
  { icon: "🔊", label: "Speaker", desc: "Deafen / undeafen all audio" },
  { icon: "🐿️", label: "Voice FX", desc: "Chipmunk, robot, deep, radio, echo" },
  { icon: "🎭", label: "Room", desc: "Concert hall, cave, outdoor reverb" },
  { icon: "💬", label: "Captions", desc: "Live AI speech-to-text overlay" },
  { icon: "🧠", label: "AI Mod", desc: "Auto-arrange everyone in 3D space" },
  { icon: "🎵", label: "Music", desc: "Spatial background music" },
  { icon: "⏺", label: "Record", desc: "Record the session" },
  { icon: "♿", label: "Access", desc: "Accessibility distance HUD" },
  { icon: "🚪", label: "Leave", desc: "Leave the room" },
];

export function HelpCard() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="glass rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 max-w-lg w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Controls</span>
          <button
            onClick={() => setVisible(false)}
            className="text-slate-500 hover:text-white text-xs transition"
          >
            ✕ dismiss
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">{f.icon}</span>
              <span className="text-[10px] font-semibold text-white">{f.label}</span>
              <span className="text-[9px] text-slate-400 leading-tight">{f.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3">
          Drag your orb to move in 3D space · Others hear you spatially
        </p>
      </div>
    </div>
  );
}
