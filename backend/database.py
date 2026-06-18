import jwt
from jwt import PyJWKClient
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import get_settings
from .database import get_db

bearer = HTTPBearer(auto_error=True)


@lru_cache
def _jwk_client() -> PyJWKClient:
    s = get_settings()
    jwks_url = f"{s.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def _decode(token: str) -> dict:
    """
    Verificér et Supabase-JWT.

    Projektet signerer med asymmetriske nøgler (ECC/ES256), så den offentlige
    nøgle hentes fra projektets JWKS-endpoint. Falder tilbage til HS256 med den
    gamle JWT-secret, hvis SUPABASE_JWT_SECRET er sat (for legacy-tokens).
    """
    s = get_settings()

    # 1) Asymmetrisk (ES256/RS256) via JWKS — den nuværende signeringsnøgle
    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except HTTPException:
        raise
    except Exception:
        pass  # falder videre til HS256-fallback

    # 2) Fallback: legacy HS256 shared secret
    if s.supabase_jwt_secret:
        try:
            return jwt.decode(
                token,
                s.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError:
            pass

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ugyldigt token")


def get_current_player(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    payload = _decode(cred.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token mangler bruger-id")

    db = get_db()
    res = db.table("players").select("*").eq("id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="Ingen spillerprofil fundet")
    return res.data[0]


def require_admin(player: dict = Depends(get_current_player)) -> dict:
    if not player.get("is_admin"):
        raise HTTPException(status_code=403, detail="Kræver admin-rettigheder")
    return player
