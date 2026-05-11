"use client";

import { Circle } from "lucide-react";

export function RecordingBadge() {
  return (
    <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
      <Circle className="w-3 h-3 text-red-400 fill-current animate-pulse" />
      <span className="text-xs font-medium text-red-400">Recording</span>
    </div>
  );
}
