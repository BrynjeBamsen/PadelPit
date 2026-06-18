from fastapi import APIRouter, Depends
from ..database import get_db
from ..auth import get_current_player

router = APIRouter(prefix="/league", tags=["league"])


@router.get("/fixtures")
def fixtures(player: dict = Depends(get_current_player)):
    db = get_db()
    return (
        db.table("league_fixtures").select("*")
        .eq("status", "upcoming").order("starts_at").execute().data
    )


@router.get("/results")
def results(player: dict = Depends(get_current_player)):
    db = get_db()
    return (
        db.table("league_fixtures").select("*")
        .eq("status", "finished").order("starts_at", desc=True).execute().data
    )
