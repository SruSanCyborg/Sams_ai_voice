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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 glass rounded-xl px-4 py-2 flex items-center gap-2 border border-violet-500/30"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-violet-300">
            Whisper mode with{" "}
            <strong className="text-white">{nearby.map((p) => p.name).join(", ")}</strong>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
