from typing import Optional, Literal
from pydantic import BaseModel, EmailStr


# ---- auth ----
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    rankedin_id: Optional[str] = None
    invite_code: str


# ---- events ----
class EventCreate(BaseModel):
    type: Literal["training", "match", "league"]
    title: str
    starts_at: str          # ISO 8601
    location: Optional[str] = None


class RsvpRequest(BaseModel):
    status: Literal["in", "maybe", "out"]


class EventOut(BaseModel):
    id: int
    type: str
    title: str
    starts_at: str
    location: Optional[str]
    synced: bool
    counts: dict            # {"in": n, "maybe": n, "out": n}
    my_status: Optional[str]


# ---- dues ----
class MarkPaidRequest(BaseModel):
    mobilepay_ref: Optional[str] = None
