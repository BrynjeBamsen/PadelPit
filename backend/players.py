from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_player
from ..schemas import MarkPaidRequest

router = APIRouter(prefix="/dues", tags=["dues"])


@router.get("/current")
def current(player: dict = Depends(get_current_player)):
    """Nyeste kontingentperiode: dit beløb, din status og hele oversigten."""
    db = get_db()
    due = (
        db.table("dues").select("*").order("created_at", desc=True).limit(1).execute().data
    )
    if not due:
        return {"due": None, "my_paid": False, "ledger": []}
    due = due[0]

    players = db.table("players").select("id, full_name").execute().data
    payments = db.table("due_payments").select("*").eq("due_id", due["id"]).execute().data
    paid_by = {p["player_id"]: p for p in payments}

    ledger = [
        {
            "player_id": p["id"],
            "full_name": p["full_name"],
            "paid": bool(paid_by.get(p["id"], {}).get("paid")),
            "is_me": p["id"] == player["id"],
        }
        for p in players
    ]
    return {
        "due": {
            "id": due["id"],
            "period": due["period"],
            "description": due.get("description"),
            "amount_ore": due["amount_ore"],
            "mobilepay_link": due.get("mobilepay_link"),
        },
        "my_paid": bool(paid_by.get(player["id"], {}).get("paid")),
        "ledger": ledger,
    }


@router.post("/{due_id}/pay")
def mark_paid(due_id: int, body: MarkPaidRequest, player: dict = Depends(get_current_player)):
    """
    v1: manuel bekræftelse efter MobilePay-betaling via link/QR.
    Skift til Recurring API + webhook her hvis I får et CVR.
    """
    db = get_db()
    exists = db.table("dues").select("id").eq("id", due_id).execute().data
    if not exists:
        raise HTTPException(status_code=404, detail="Ukendt kontingentperiode")

    db.table("due_payments").upsert({
        "due_id": due_id,
        "player_id": player["id"],
        "paid": True,
        "paid_at": datetime.now(timezone.utc).isoformat(),
        "mobilepay_ref": body.mobilepay_ref,
    }).execute()
    return {"ok": True}
