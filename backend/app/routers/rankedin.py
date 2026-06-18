from fastapi import APIRouter, Header, HTTPException, Depends
from ..config import get_settings
from ..database import get_db
from ..auth import get_current_player
from ..services.rankedin_sync import run_sync

router = APIRouter(prefix="/rankedin", tags=["rankedin"])


@router.post("/sync")
async def trigger_sync(x_sync_secret: str = Header(default="")):
    """Kaldes af et Railway cron-job. Beskyttet med SYNC_SECRET-header."""
    if x_sync_secret != get_settings().sync_secret:
        raise HTTPException(status_code=401, detail="Forkert sync-secret")
    return await run_sync()


@router.get("/status")
def status(player: dict = Depends(get_current_player)):
    db = get_db()
    rows = (
        db.table("sync_log").select("*")
        .eq("source", "rankedin").order("ran_at", desc=True).limit(1).execute().data
    )
    return rows[0] if rows else {"status": "never_run"}
