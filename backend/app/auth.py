import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import get_settings
from .database import get_db

bearer = HTTPBearer(auto_error=True)


def _decode(token: str) -> dict:
    """
    Verificér et Supabase-JWT (HS256 med projektets JWT-secret).

    Bruger dit projekt asymmetriske signing keys (nyere Supabase-default),
    så skift til JWKS-verifikation mod
    {SUPABASE_URL}/auth/v1/.well-known/jwks.json i stedet.
    """
    s = get_settings()
    try:
        return jwt.decode(
            token,
            s.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Ugyldigt token: {e}",
        )


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
