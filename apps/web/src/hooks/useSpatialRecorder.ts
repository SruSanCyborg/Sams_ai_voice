import { useRef, useCallback } from "react";
import { strFromU8, zipSync } from "fflate";
import { useAudioStore } from "@/store/useAudioStore";
import { useRoomStore } from "@/store/useRoomStore";

interface PositionFrame {
  t_ms: number;
  participantId: string;
  x: number;
  y: number;
  z: number;
}

export function useSpatialRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const positionsRef = useRef<PositionFrame[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isRecording, setRecording } = useAudioStore();

  const start = useCallback(() => {
    const stream = (window as any).__echo3d_outputStream as MediaStream | undefined;
    if (!stream) {
      console.warn("[SpatialRecorder] No output stream available");
      return;
    }

    chunksRef.current = [];
    positionsRef.current = [];
    startTimeRef.current = Date.now();

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(100);
    recorderRef.current = recorder;

    // Record positions every 100ms
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const participants = useRoomStore.getState().participants;
      participants.forEach((p) => {
        positionsRef.current.push({
          t_ms: elapsed,
          participantId: p.id,
          x: p.position[0],
          y: p.position[1],
          z: p.position[2],
        });
      });
    }, 100);

    setRecording(true);
  }, [setRecording]);

  const stop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const recorder = recorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    setRecording(false);

    // Build ZIP with audio + positions
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    const audioBuffer = await audioBlob.arrayBuffer();
    const posJson = JSON.stringify(positionsRef.current, null, 2);
    const posBytes = new TextEncoder().encode(posJson);

    const zip = zipSync({
      "audio.webm": new Uint8Array(audioBuffer as ArrayBuffer),
      "positions.json": posBytes,
    });

    const url = URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo3d-spatial-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [setRecording]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  return { isRecording, start, stop, toggle };
}
