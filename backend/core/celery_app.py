from celery import Celery

from core.config import settings


celery_app = Celery(
    "distill",
    broker=settings.redis_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=("tasks.document_processing",),
)
