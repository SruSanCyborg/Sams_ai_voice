from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from routers import rooms, presence, captions, moderator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Redis is optional — skip if not configured
    try:
        import redis.asyncio as aioredis
        if settings.redis_url and "localhost" not in settings.redis_url:
            client = aioredis.from_url(settings.redis_url, decode_responses=True)
            app.state.redis = client
            yield
            await client.aclose()
            return
    except Exception as e:
        print(f"[startup] Redis unavailable, running without it: {e}")
    app.state.redis = None
    yield


app = FastAPI(title="ECHO-3D Backend", version="0.1.0", lifespan=lifespan)

_origins = list(settings.cors_origins)
if settings.cors_origin_extra:
    _origins += [o.strip() for o in settings.cors_origin_extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
