import base64
import binascii
import json
import logging
from typing import Any
from functools import lru_cache
from urllib.request import urlopen
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

class CurrentUser(BaseModel):
    clerk_user_id: str
    email: str | None = None


def _derive_clerk_issuer_from_publishable_key() -> str | None:
    publishable_key = (
        settings.clerk_publishable_key
        or settings.next_public_clerk_publishable_key
    )
    if not publishable_key:
        return None

    encoded_key = ""
    for prefix in ("pk_test_", "pk_live_"):
        if publishable_key.startswith(prefix):
            encoded_key = publishable_key.removeprefix(prefix)
            break

    if not encoded_key:
        return None

    try:
        padding = "=" * (-len(encoded_key) % 4)
        decoded_key = base64.urlsafe_b64decode(
            f"{encoded_key}{padding}"
        ).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError):
        logger.warning("Unable to derive Clerk issuer from publishable key.")
        return None

    issuer = decoded_key.rstrip("$").rstrip("/")
    if not issuer:
        return None

    if issuer.startswith("https://"):
        return issuer

    return f"https://{issuer}"


def get_clerk_issuer() -> str | None:
    return settings.clerk_issuer.rstrip("/") or _derive_clerk_issuer_from_publishable_key()


def get_clerk_jwks_url() -> str | None:
    if settings.clerk_jwks_url:
        return settings.clerk_jwks_url

    issuer = get_clerk_issuer()
    if issuer:
        return f"{issuer}/.well-known/jwks.json"

    return None


@lru_cache(maxsize=1)
def get_clerk_jwks() -> dict[str, Any]:
    jwks_url = get_clerk_jwks_url()
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk JWT verification is not configured",
        )
    try:
        response = urlopen(jwks_url, timeout=5)
        return json.loads(response.read())
    except Exception as e:
        logger.error(f"Failed to fetch Clerk JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch auth keys",
        )

def verify_clerk_token(token: str) -> dict[str, Any]:
    jwks = get_clerk_jwks()
    clerk_issuer = get_clerk_issuer()
    
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
        )

    rsa_key = {}
    if "kid" not in unverified_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token kid",
        )

    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key",
        )

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.clerk_audience if settings.clerk_audience else None,
            issuer=clerk_issuer,
            options={"verify_aud": bool(settings.clerk_audience)}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired",
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect claims, please check audience and issuer",
        )
    except Exception as e:
        logger.error(f"JWT Verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    token = credentials.credentials
    payload = verify_clerk_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )
        
    return CurrentUser(clerk_user_id=user_id)
