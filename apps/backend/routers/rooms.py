import time
from fastapi import APIRouter, HTTPException
from livekit.api import AccessToken, VideoGrants
from models.schemas import TokenRequest, TokenResponse
from config import settings

router = APIRouter()


@router.post("/token", response_model=TokenResponse)
async def create_token(req: TokenRequest):
    try:
        token = (
            AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
            .with_identity(req.participant_name)
            .with_name(req.participant_name)
            .with_grants(VideoGrants(
                room_join=True,
                room=req.room_id,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            ))
            .to_jwt()
        )
        return TokenResponse(
            token=token,
            livekit_url=settings.livekit_url,
            room_id=req.room_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{room_id}")
async def get_room(room_id: str):
    return {"room_id": room_id, "created_at": int(time.time())}
