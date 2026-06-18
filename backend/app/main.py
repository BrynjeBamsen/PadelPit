from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, events, league, players, dues, rankedin

settings = get_settings()

app = FastAPI(title="PADELPIT API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(league.router)
app.include_router(players.router)
app.include_router(dues.router)
app.include_router(rankedin.router)


@app.get("/health")
def health():
    return {"status": "ok", "app": "padelpit"}
