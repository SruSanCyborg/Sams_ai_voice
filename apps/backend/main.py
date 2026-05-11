from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as aioredis

from config import settings
from routers import rooms, presence, captions, moderator

redis_client: aioredis.Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    app.state.redis = redis_client
    yield
    await redis_client.aclose()


app = FastAPI(title="ECHO-3D Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
app.include_router(presence.router, prefix="/presence", tags=["presence"])
app.include_router(captions.router, prefix="/captions", tags=["captions"])
app.include_router(moderator.router, prefix="/moderator", tags=["moderator"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "echo-3d-backend"}
