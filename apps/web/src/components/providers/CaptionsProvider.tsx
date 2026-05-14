"use client";

import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useAudioStore } from "@/store/useAudioStore";

const BACKEND_WS = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://web-production-99e58.up.railway.app"
).replace(/^https/, "wss").replace(/^http/, "ws");

export function CaptionsProvider({ roomId }: { roomId: string }) {
  const captionsEnabled = useAudioStore((s) => s.captionsEnabled);
  const localId = useRoomStore((s) => s.localId);
  const addCaption = useRoomStore((s) => s.addCaption);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!captionsEnabled || !localId) return;

    let ws: WebSocket | null = null;
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    activeRef.current = true;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const url = `${BACKEND_WS}/captions/ws/${roomId}/${localId}`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!stream || !activeRef.current) return;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 500 && ws?.readyState === WebSocket.OPEN) {
            e.data.arrayBuffer().then((buf) => ws?.send(buf));
          }
        };
        recorder.start(2000);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.text) {
            addCaption({
              id: `${Date.now()}-${Math.random()}`,
              participantId: msg.participant_id || localId || "",
              text: msg.text,
              timestamp: Date.now(),
            });
          }
        } catch {}
      };
    }

    start().catch(console.error);

    return () => {
      activeRef.current = false;
      recorder?.stop();
      ws?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [captionsEnabled, localId, roomId]);

  return null;
}
