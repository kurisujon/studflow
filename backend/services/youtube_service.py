import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def search_related_videos(query: str, max_results: int = 4) -> list[dict[str, str]]:
    if not settings.youtube_api_key:
        logger.warning("YOUTUBE_API_KEY is not set. Skipping YouTube search.")
        return []

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": settings.youtube_api_key,
        "safeSearch": "moderate",
        "relevanceLanguage": "en",
    }

    try:
        response = httpx.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        videos = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId")
            
            if not video_id:
                continue

            # Safely get the best thumbnail
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = (
                thumbnails.get("high", {}).get("url")
                or thumbnails.get("medium", {}).get("url")
                or thumbnails.get("default", {}).get("url")
                or ""
            )

            videos.append(
                {
                    "title": snippet.get("title", ""),
                    "channel_title": snippet.get("channelTitle", ""),
                    "video_id": video_id,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail_url": thumbnail_url,
                    "description": snippet.get("description", ""),
                    "published_at": snippet.get("publishedAt", ""),
                }
            )

        return videos
    except Exception as exc:
        logger.warning("Failed to fetch YouTube videos: %s", exc)
        return []
