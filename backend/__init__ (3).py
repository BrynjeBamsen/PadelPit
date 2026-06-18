from fastapi import APIRouter, Depends
from ..database import get_db
from ..auth import get_current_player

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/rankings")
def rankings(player: dict = Depends(get_current_player)):
    db = get_db()
    rows = (
        db.table("players")
        .select("id, full_name, rankedin_id, ranking_points, wins, losses")
        .order("ranking_points", desc=True).execute().data
    )
    return [
        {
            "pos": i + 1,
            "id": r["id"],
            "full_name": r["full_name"],
            "ranking_points": r["ranking_points"],
            "wins": r["wins"],
            "losses": r["losses"],
            "is_me": r["id"] == player["id"],
        }
        for i, r in enumerate(rows)
    ]


@router.get("/me")
def me(player: dict = Depends(get_current_player)):
    return player
