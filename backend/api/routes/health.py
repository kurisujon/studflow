from fastapi import APIRouter

from core.config import settings

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """Lightweight health-check endpoint. Returns app status and version."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
    }
