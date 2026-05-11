"use client";

import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store/useRoomStore";

export function AccessibilityHUD() {
  const participants = useRoomStore((s) => [...s.participants.values()]);
  const localParticipant = useRoomStore((s) => s.getLocalParticipant());

  return (
    <div className="glass rounded-2xl p-3 w-56 space-y-2">
      <div className="text-xs font-semibold text-slate-400 mb-2">Direction Compass</div>

      {/* 2D Compass rose */}
      <div className="relative w-40 h-40 mx-auto">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-4 rounded-full border border-white/5" />

        {/* N/S/E/W labels */}
        {[
          { label: "N", x: "50%", y: "4px" },
          { label: "S", x: "50%", y: "calc(100% - 14px)" },
          { label: "E", x: "calc(100% - 10px)", y: "50%" },
          { label: "W", x: "4px", y: "50%" },
        ].map(({ label, x, y }) => (
          <span
            key={label}
            className="absolute text-[9px] text-slate-500 -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            {label}
          </span>
        ))}

        {/* Center dot (listener) */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-green-400" />

        {/* Speaker direction arrows */}
        {participants
          .filter((p) => !p.isLocal && localParticipant)
          .map((p) => {
            if (!localParticipant) return null;
            const dx = p.position[0] - localParticipant.position[0];
            const dz = p.position[2] - localParticipant.position[2];
            const angle = Math.atan2(dx, -dz);
            const dist = Math.min(Math.sqrt(dx * dx + dz * dz), 8);
            const radius = (dist / 8) * 55;
            const cx = 80 + radius * Math.sin(angle);
            const cy = 80 - radius * Math.cos(angle);

            return (
              <div
                key={p.id}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center"
                style={{
                  left: cx,
                  top: cy,
                  background: p.speaking ? p.color : `${p.color}80`,
                  boxShadow: p.speaking ? `0 0 8px ${p.color}` : "none",
                }}
                title={p.name}
              />
            );
          })}
      </div>

      {/* Per-speaker waveforms */}
      <div className="space-y-1">
        {participants
          .filter((p) => !p.isLocal)
          .map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: p.color }}
              />
              <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden relative">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded transition-all duration-75"
                  style={{
                    width: `${(p.amplitude || 0) * 100}%`,
                    background: `linear-gradient(90deg, ${p.color}60, ${p.color})`,
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-500 w-10 truncate">{p.name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
