"use client";

import { useRoomStore } from "@/store/useRoomStore";
import { EMOTION_COLORS } from "@/types/spatial";

export function UserList() {
  const participants = useRoomStore((s) => [...s.participants.values()]);
  const hostId = useRoomStore((s) => s.hostId);

  return (
    <div className="glass rounded-2xl p-3 w-56 max-h-full overflow-y-auto space-y-2">
      <div className="text-xs font-semibold text-slate-400 mb-2 px-1">
        Participants ({participants.length})
      </div>
      {participants.map((p) => {
        const isHost = p.id === hostId;
        return (
          <div
            key={p.id}
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-all"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: p.color }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-white truncate">{p.name}</span>
                {isHost && (
                  <span title="Host" className="text-[11px]">👑</span>
                )}
                {p.isLocal && (
                  <span className="text-[10px] text-green-400">(you)</span>
                )}
              </div>

              <div className="flex items-center gap-1 mt-0.5">
                {p.speaking ? (
                  <div className="flex items-end gap-0.5 h-3">
                    {[0.4, 0.8, 0.6, 1, 0.7].map((h, i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full animate-pulse"
                        style={{ height: `${h * 100}%`, background: p.color, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                )}
                {p.emotion !== "neutral" && (
                  <span
                    className="text-[10px] px-1 rounded"
                    style={{ background: `${EMOTION_COLORS[p.emotion]}20`, color: EMOTION_COLORS[p.emotion] }}
                  >
                    {p.emotion}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
