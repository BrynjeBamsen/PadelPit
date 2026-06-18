from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from ..database import get_db
from ..auth import get_current_player, require_admin
from ..schemas import EventCreate, RsvpRequest

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def list_events(player: dict = Depends(get_current_player)):
    """Kommende events med tilmeldingstal og din egen status."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    events = (
        db.table("events").select("*").gte("starts_at", now)
        .order("starts_at").execute().data
    )
    if not events:
        return []

    event_ids = [e["id"] for e in events]
    rsvps = db.table("rsvps").select("*").in_("event_id", event_ids).execute().data

    by_event: dict[int, dict] = {}
    for r in rsvps:
        b = by_event.setdefault(r["event_id"], {"in": 0, "maybe": 0, "out": 0, "mine": None})
        b[r["status"]] += 1
        if r["player_id"] == player["id"]:
            b["mine"] = r["status"]

    out = []
    for e in events:
        c = by_event.get(e["id"], {"in": 0, "maybe": 0, "out": 0, "mine": None})
        out.append({
            "id": e["id"],
            "type": e["type"],
            "title": e["title"],
            "starts_at": e["starts_at"],
            "location": e.get("location"),
            "synced": bool(e.get("rankedin_event_id")),
            "counts": {"in": c["in"], "maybe": c["maybe"], "out": c["out"]},
            "my_status": c["mine"],
        })
    return out


@router.post("")
def create_event(body: EventCreate, admin: dict = Depends(require_admin)):
    db = get_db()
    res = db.table("events").insert({
        "type": body.type,
        "title": body.title,
        "starts_at": body.starts_at,
        "location": body.location,
        "created_by": admin["id"],
    }).execute()
    return res.data[0]


@router.put("/{event_id}/rsvp")
def set_rsvp(event_id: int, body: RsvpRequest, player: dict = Depends(get_current_player)):
    db = get_db()
    db.table("rsvps").upsert({
        "event_id": event_id,
        "player_id": player["id"],
        "status": body.status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return {"ok": True, "status": body.status}
