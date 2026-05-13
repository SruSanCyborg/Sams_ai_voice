from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    livekit_url: str = "ws://localhost:7880"
    livekit_api_key: str = "devkey"
    livekit_api_secret: str = "devsecret"
    redis_url: str = "redis://localhost:6379"
    groq_api_key: str = ""
    whisper_model: str = "tiny.en"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "https://*.vercel.app"]
    cors_origin_extra: str = ""  # comma-separated additional origins for production

    class Config:
        env_file = ".env"


settings = Settings()
