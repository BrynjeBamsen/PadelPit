from functools import lru_cache
from supabase import create_client, Client
from .config import get_settings


@lru_cache
def get_db() -> Client:
    """Service-role client. Omgår RLS — kun til brug server-side."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_key)
