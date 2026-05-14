from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from config import settings

router = APIRouter()


@router.websocket("/ws/{room_id}/{participant_id}")
async def caption_websocket(ws: WebSocket, room_id: str, participant_id: str):
    await ws.accept()

    if not settings.groq_api_key:
        await ws.send_json({"error": "GROQ_API_KEY not configured on server"})
        await ws.close()
        return

    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)

    try:
        while True:
            data = await ws.receive_bytes()
            if len(data) < 1000:
                continue
            try:
                result = await client.audio.transcriptions.create(
                    file=("audio.webm", data, "audio/webm"),
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
