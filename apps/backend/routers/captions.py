import asyncio
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import threading

router = APIRouter()

# Try to load faster-whisper; fall back to null transcriber if not available
try:
    from faster_whisper import WhisperModel
    from config import settings as _settings

    _model: "WhisperModel | None" = None
    _model_lock = threading.Lock()

    def get_model() -> "WhisperModel":
        global _model
        if _model is None:
            with _model_lock:
                if _model is None:
                    _model = WhisperModel(_settings.whisper_model, device="cpu", compute_type="int8")
        return _model

    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

    def get_model():  # type: ignore
        return None


@router.websocket("/ws/{room_id}/{participant_id}")
async def caption_websocket(ws: WebSocket, room_id: str, participant_id: str):
    await ws.accept()

    if not WHISPER_AVAILABLE:
        # Notify client and close gracefully
        await ws.send_json({"error": "faster-whisper not installed; captions unavailable"})
        await ws.close()
        return

    model = get_model()
    pcm_buffer = bytearray()
    SAMPLE_RATE = 48_000
    CHUNK_SAMPLES = SAMPLE_RATE * 2  # 2 seconds of audio

    try:
        while True:
            data = await ws.receive_bytes()
            pcm_buffer.extend(data)

            if len(pcm_buffer) >= CHUNK_SAMPLES * 2:  # int16 = 2 bytes
                chunk = bytes(pcm_buffer[:CHUNK_SAMPLES * 2])
                pcm_buffer = pcm_buffer[CHUNK_SAMPLES * 2:]

                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, _transcribe, model, chunk, SAMPLE_RATE
                )
                if result:
                    await ws.send_json({
                        "participant_id": participant_id,
                        "text": result,
                        "room_id": room_id,
                    })
    except WebSocketDisconnect:
        pass


def _transcribe(model, pcm_bytes: bytes, sample_rate: int) -> str:
    if model is None:
        return ""
    audio = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio, language="en", vad_filter=True)
    return " ".join(s.text.strip() for s in segments if s.text.strip())
