from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Studflow API"
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
    gemini_embedding_model: str = "text-embedding-004"
    embedding_dimensions: int = 768
    embedding_batch_size: int = 24
    rag_top_k: int = 5
    rag_cluster_max_chunks: int = 5

    # Long-running document processing
    document_processing_max_retries: int = 3
    celery_task_soft_time_limit: int = 300
    celery_task_time_limit: int = 600

    @property
    def gemini_api_keys(self) -> list[str]:
        """Returns a list of API keys parsed from the comma-separated string."""
        if not self.gemini_api_key:
            return []
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    # YouTube API
    youtube_api_key: str = ""

    # Security
    secret_key: str = "change-this-to-a-strong-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Clerk Auth
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    next_public_clerk_publishable_key: str = ""
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3002"]

    @model_validator(mode="after")
    def validate_pgvector_dimensions(self) -> "Settings":
        if self.embedding_dimensions != 768:
            raise ValueError(
                "EMBEDDING_DIMENSIONS must remain 768 to match document_chunks.embedding."
            )
        return self


settings = Settings()
