from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.health import router as health_router
from api.routes.documents import router as documents_router
from api.routes.study import router as study_router
from api.routes.upload import router as upload_router
from core.config import settings
from core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Run startup and shutdown logic."""
    # Startup: explicit opt-in for create_all during local bootstrap only.
    if settings.auto_create_tables:
        init_db()
    yield
    # Shutdown: nothing to clean up at this stage


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for the Studflow AI Study Workflow System.",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(study_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
