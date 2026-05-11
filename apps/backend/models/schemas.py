from pydantic import BaseModel
from typing import Optional


class TokenRequest(BaseModel):
    room_id: str
    participant_name: str


class TokenResponse(BaseModel):
    token: str
    livekit_url: str
    room_id: str


class PositionUpdate(BaseModel):
    participant_id: str
    x: float
    y: float
    z: float


class ModeratorRequest(BaseModel):
    room_id: str
    participants: list[dict]
    speaking_history: list[str] = []


class ModeratorSuggestion(BaseModel):
    participant_id: str
    suggested_position: list[float]
    reason: str
