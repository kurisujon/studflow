from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Distill API"
    app_version: str = "0.1.0"
    debug: bool = False
    auto_create_tables: bool = False

    # Database — psycopg3 (ships pre-built wheels for Python 3.14)
    database_url: str = "postgresql+psycopg://postgres:password@localhost:5432/distill"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Supabase Storage
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_storage_bucket: str = "documents"
    supabase_storage_folder: str = "uploads"

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_fallback_models: str = ""
    gemini_max_retries: int = 3

    @property
    def gemini_api_keys(self) -> list[str]:
        """Returns a list of API keys parsed from the comma-separated string."""
        if not self.gemini_api_key:
            return []
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    # Security
    secret_key: str = "change-this-to-a-strong-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3002"]


settings = Settings()
