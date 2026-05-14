"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  { icon: "🎤", label: "Mic",    desc: "Mute / unmute" },
  { icon: "🔊", label: "Speaker", desc: "Deafen all audio" },
  { icon: "🐿️", label: "Voice FX", desc: "5 voice presets" },
  { icon: "🎭", label: "Room",   desc: "Hall/cave/outdoor" },
  { icon: "💬", label: "Captions", desc: "AI speech-to-text" },
  { icon: "🧠", label: "AI Mod", desc: "Auto-arrange space" },
  { icon: "🎵", label: "Music",  desc: "Ambient drone pad" },
  { icon: "🌐", label: "Bubble", desc: "Private audio zone" },
  { icon: "⏺",  label: "Record", desc: "Export session ZIP" },
  { icon: "🚪", label: "Leave",  desc: "Exit the room" },
];

export function HelpCard() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2.5 pointer-events-auto"
        >
          <div
            className="glass rounded-2xl px-5 py-4 max-w-[430px] w-[90vw]"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                Controls
              </span>
              <button
                onClick={() => setVisible(false)}
                className="text-[10px] text-slate-600 hover:text-slate-300 transition-colors"
              >
                dismiss ✕
              </button>
            </div>

            <div className="grid grid-cols-5 gap-x-2 gap-y-3">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-base leading-none">{f.icon}</span>
                  <span className="text-[10px] font-semibold text-white leading-tight">{f.label}</span>
                  <span className="text-[8px] text-slate-500 leading-tight">{f.desc}</span>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-600 text-center mt-3">
              Drag your orb to move · wear headphones for full binaural 3D
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
