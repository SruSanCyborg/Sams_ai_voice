import io
import wave
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from config import settings

router = APIRouter()

SAMPLE_RATE = 48_000
CHUNK_SAMPLES = SAMPLE_RATE * 2  # 2 seconds of audio per transcription call


def _pcm_to_wav(pcm_bytes: bytes) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # int16
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()


@router.websocket("/ws/{room_id}/{participant_id}")
async def caption_websocket(ws: WebSocket, room_id: str, participant_id: str):
    await ws.accept()

    if not settings.groq_api_key:
        await ws.send_json({"error": "Groq API key not configured; captions unavailable"})
        await ws.close()
        return

    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)
    pcm_buffer = bytearray()

    try:
        while True:
            data = await ws.receive_bytes()
            pcm_buffer.extend(data)

            if len(pcm_buffer) >= CHUNK_SAMPLES * 2:  # int16 = 2 bytes/sample
                chunk = bytes(pcm_buffer[: CHUNK_SAMPLES * 2])
                pcm_buffer = pcm_buffer[CHUNK_SAMPLES * 2 :]

                try:
                    wav = _pcm_to_wav(chunk)
                    result = await client.audio.transcriptions.create(
                        file=("audio.wav", wav, "audio/wav"),
                        model="whisper-large-v3-turbo",
                        language="en",
                        response_format="text",
                    )
                    text = result.strip() if isinstance(result, str) else ""
                    if text:
                        await ws.send_json({
                            "participant_id": participant_id,
                            "text": text,
                            "room_id": room_id,
                        })
                except Exception as e:
                    print(f"[captions] Groq error: {e}")

    except WebSocketDisconnect:
        pass
