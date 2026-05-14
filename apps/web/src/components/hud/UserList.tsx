"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/store/useRoomStore";

const BAR_DURATIONS = [0.42, 0.37, 0.44, 0.39, 0.41];

function WaveformBars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {BAR_DURATIONS.map((dur, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: "100%",
            background: color,
            transformOrigin: "bottom",
            animation: `waveBar ${dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}

export function UserList() {
  const participants = useRoomStore((s) => [...s.participants.values()]);
  const hostId = useRoomStore((s) => s.hostId);

  return (
    <div
      className="glass rounded-2xl p-2.5 w-48 max-h-full overflow-y-auto"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 16px 48px rgba(0,0,0,0.55)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1.5">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          In room
        </span>
        <span
          className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)", color: "#7c7c9a" }}
        >
          {participants.length}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {participants.map((p) => {
          const isHost = p.id === hostId;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto", marginBottom: 2 }}
              exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
                style={{
                  background: p.speaking ? `${p.color}0a` : "transparent",
                }}
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{
                      background: p.color,
                      boxShadow: p.speaking ? `0 0 12px ${p.color}55` : "none",
                      transition: "box-shadow 0.3s ease",
                    }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  {p.isLocal && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: "#22c55e", borderColor: "#0a0a1a" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate leading-none">
                      {p.name}
                    </span>
                    {isHost && <span className="text-[9px] leading-none flex-shrink-0">👑</span>}
                  </div>

                  {/* Status row */}
                  <div className="mt-0.5 h-3">
                    {p.speaking ? (
                      <WaveformBars color={p.color} />
                    ) : (
                      <span className="text-[9px] text-slate-600">
                        {p.isLocal ? "you" : "listening"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
