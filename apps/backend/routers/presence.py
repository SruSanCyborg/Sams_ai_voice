import asyncio
import json
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

router = APIRouter()


@router.get("/room/{room_id}")
async def room_presence(room_id: str, request: Request):
    redis = request.app.state.redis

    async def event_generator():
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"room:{room_id}:presence")
        try:
            while True:
                if await request.is_disconnected():
                    break
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg:
                    yield {"data": msg["data"]}
                await asyncio.sleep(0.05)
        finally:
            await pubsub.unsubscribe(f"room:{room_id}:presence")
            await pubsub.aclose()

    return EventSourceResponse(event_generator())


@router.post("/room/{room_id}/join")
async def join_room(room_id: str, request: Request):
    body = await request.json()
    redis = request.app.state.redis
    await redis.publish(
        f"room:{room_id}:presence",
        json.dumps({"type": "join", **body}),
    )
    return {"ok": True}


@router.post("/room/{room_id}/leave")
async def leave_room(room_id: str, request: Request):
    body = await request.json()
    redis = request.app.state.redis
    await redis.publish(
        f"room:{room_id}:presence",
        json.dumps({"type": "leave", **body}),
    )
    return {"ok": True}
