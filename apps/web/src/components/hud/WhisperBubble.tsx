"use client";

import { useRoomStore } from "@/store/useRoomStore";
import { distance3D } from "@/lib/hrtfUtils";
import { WHISPER_DISTANCE } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

export function WhisperBubble() {
  const participants = useRoomStore((s) => [...s.participants.values()]);
  const localP = useRoomStore((s) => s.getLocalParticipant());

  if (!localP) return null;

  const nearby = participants.filter(
    (p) => !p.isLocal && distance3D(localP.position, p.position) < WHISPER_DISTANCE
  );

  return (
    <AnimatePresence>
      {nearby.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30"
        >
          <div
            className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
            style={{
              background: "rgba(124,58,237,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 28px rgba(124,58,237,0.18), 0 0 0 1px rgba(124,58,237,0.15)",
            }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping" />
            </div>
            <span className="text-xs text-violet-200 font-medium whitespace-nowrap">
              Whispering with{" "}
              <strong className="text-white font-bold">
                {nearby.map((p) => p.name).join(", ")}
              </strong>
            </span>
            <span className="text-[10px] text-violet-400/60 ml-1">· private</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
