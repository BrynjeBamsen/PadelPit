from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str = ""   # valgfri: kun til legacy HS256-fallback

    rankedin_base_url: str = "https://api.rankedin.com"
    rankedin_player_id: str = ""

    cors_origins: str = "http://localhost:5173"
    sync_secret: str = "change-me"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
