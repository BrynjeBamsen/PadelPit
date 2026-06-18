from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..schemas import SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
def signup(req: SignupRequest):
    """
    Lukket signup: kræver gyldig invitationskode. Login sker derefter
    direkte mod Supabase i frontend (supabase-js) for at få et JWT.
    """
    db = get_db()

    # 1) valider invitationskode
    inv = db.table("invite_codes").select("*").eq("code", req.invite_code).limit(1).execute()
    if not inv.data:
        raise HTTPException(status_code=400, detail="Ukendt invitationskode")
    code = inv.data[0]
    if code.get("used_by"):
        raise HTTPException(status_code=400, detail="Invitationskoden er allerede brugt")
    if code.get("expires_at") and datetime.fromisoformat(code["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitationskoden er udløbet")

    # 2) opret bruger i Supabase Auth (e-mail bekræftet, da det er lukket gruppe)
    try:
        created = db.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {"full_name": req.full_name},
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kunne ikke oprette bruger: {e}")

    user_id = created.user.id

    # 3) opret spillerprofil
    try:
        db.table("players").insert({
            "id": user_id,
            "full_name": req.full_name,
            "email": req.email,
            "rankedin_id": req.rankedin_id,
        }).execute()
    except Exception as e:
        # rul brugeren tilbage hvis profilen fejler
        db.auth.admin.delete_user(user_id)
        raise HTTPException(status_code=400, detail=f"Kunne ikke oprette profil: {e}")

    # 4) marker koden som brugt
    db.table("invite_codes").update({
        "used_by": user_id,
        "used_at": datetime.now(timezone.utc).isoformat(),
    }).eq("code", req.invite_code).execute()

    return {"ok": True, "player_id": user_id}
