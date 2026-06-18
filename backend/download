"""
RankedIn-synkronisering.

RankedIn har ingen officiel API, men frontend'en kalder et internt JSON-API
på api.rankedin.com/v1. Endpoints herunder er fanget live fra rankedin.com
(player R000169277). To ting er bekræftet:

  * Host:            https://api.rankedin.com/v1
  * Kamphistorik:    GET /player/GetPlayerMatchesAsync
                       ?playerid={NUM}&takehistory=true&skip=0&take=10&language=en
  * Ligaer/kampagner: GET /campaign/GetPlayerCampaignsAsync   (params, se nedenfor)

VIGTIGT: API'et bruger et NUMERISK playerid (fx 582057), ikke R-strengen
(R000169277). Det numeriske id ligger embedded i spillerens profilside og
resolves af `resolve_numeric_id`. Vi cacher det på players.rankedin_numeric_id.

DET SIDSTE STYKKE: selve JSON-felternes navne (i map_match) kunne ikke aflæses
direkte (browseren blokerede api-subdomænet). De er sat efter hvad kamp-siden
viser og skal verificeres mod ét rigtigt response — kør modulet på Railway
(som kan nå api.rankedin.com) og log `raw` én gang, eller indsæt et JSON-svar.
"""
from __future__ import annotations
import logging
import re
from datetime import datetime, timezone

import httpx

from ..config import get_settings
from ..database import get_db

log = logging.getLogger("rankedin")

API = "https://api.rankedin.com/v1"
WEB = "https://www.rankedin.com"

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 PadelpitSync/0.2 (+privat klub-app)",
    "Referer": "https://www.rankedin.com/",
}

# Vores klubs holdnavne — bruges til at udlede modstander + hjemme/ude.
OUR_TEAMS = ("PADELPIT Roskilde 1", "PADELPIT Roskilde 2", "PADELPIT")


class RankedInClient:
    def __init__(self) -> None:
        self.http = httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True)

    async def aclose(self) -> None:
        await self.http.aclose()

    async def resolve_numeric_id(self, rankedin_id: str) -> int | None:
        """R-streng (R000169277) -> numerisk playerid (582057) via profilsiden."""
        r = await self.http.get(f"{WEB}/en/player/{rankedin_id}")
        r.raise_for_status()
        for pat in (
            r"GetPlayerMatchesAsync\?playerid=(\d+)",
            r'"playerId"\s*:\s*(\d+)',
            r'"PlayerId"\s*:\s*(\d+)',
            r"playerid=(\d+)",
        ):
            m = re.search(pat, r.text)
            if m:
                return int(m.group(1))
        return None

    async def get_player_matches(self, numeric_id: int, skip: int = 0, take: int = 50) -> list[dict]:
        r = await self.http.get(
            f"{API}/player/GetPlayerMatchesAsync",
            params={
                "playerid": numeric_id,
                "takehistory": "true",
                "skip": skip,
                "take": take,
                "language": "en",
            },
        )
        r.raise_for_status()
        data = r.json()
        # Svaret er enten en liste eller {"Matches":[...]} — håndtér begge.
        if isinstance(data, dict):
            return data.get("Matches") or data.get("matches") or []
        return data

    async def get_player_campaigns(self, numeric_id: int) -> list[dict]:
        r = await self.http.get(
            f"{API}/campaign/GetPlayerCampaignsAsync",
            params={"playerid": numeric_id, "language": "en"},
        )
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Mapping: RankedIn-kamp -> league_fixtures-række.
# NB: nøglenavnene herunder skal bekræftes mod ét rigtigt JSON-svar.
# Datafelter vi VED findes (fra kamp-siden): liganavn, "Hold A vs Hold B",
# dato dd/mm/yyyy, tid, 4 spillernavne, sætscores.
# ---------------------------------------------------------------------------
def _our_side(home: str, away: str) -> tuple[str, bool]:
    """Returnér (modstander, er_hjemme)."""
    if any(home.startswith(t) for t in OUR_TEAMS):
        return away, True
    return home, False


def map_match(raw: dict) -> dict | None:
    home = raw.get("HomeTeamName") or raw.get("ChallengerName") or ""
    away = raw.get("AwayTeamName") or raw.get("ChallengedName") or ""
    if not (home or away):
        return None

    opponent, is_home = _our_side(home, away)
    match_id = str(raw.get("Id") or raw.get("MatchId") or raw.get("id"))
    date = raw.get("Date") or raw.get("MatchDate") or raw.get("date")

    our = raw.get("HomeScore") if is_home else raw.get("AwayScore")
    their = raw.get("AwayScore") if is_home else raw.get("HomeScore")
    finished = raw.get("IsFinished", their is not None and our is not None)

    return {
        "rankedin_match_id": match_id,
        "opponent": opponent or "Ukendt",
        "starts_at": date,
        "is_home": is_home,
        "status": "finished" if finished else "upcoming",
        "our_score": our,
        "their_score": their,
        "won": (our is not None and their is not None and our > their) or None,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Orkestrering: for hver spiller med et rankedin_id, hent kampe og upsert.
# ---------------------------------------------------------------------------
async def run_sync() -> dict:
    db = get_db()
    client = RankedInClient()
    total = 0
    try:
        players = (
            db.table("players").select("id, rankedin_id, rankedin_numeric_id")
            .not_.is_("rankedin_id", "null").execute().data
        )

        all_fixtures: dict[str, dict] = {}
        for p in players:
            num = p.get("rankedin_numeric_id")
            if not num:
                num = await client.resolve_numeric_id(p["rankedin_id"])
                if num:
                    db.table("players").update({"rankedin_numeric_id": num}).eq("id", p["id"]).execute()
            if not num:
                log.warning("Kunne ikke resolve numerisk id for %s", p["rankedin_id"])
                continue

            raw_matches = await client.get_player_matches(num)
            for m in raw_matches:
                fx = map_match(m)
                if fx and fx["rankedin_match_id"]:
                    all_fixtures[fx["rankedin_match_id"]] = fx  # dedupér på match-id

        if all_fixtures:
            db.table("league_fixtures").upsert(
                list(all_fixtures.values()), on_conflict="rankedin_match_id"
            ).execute()
            total = len(all_fixtures)

        db.table("sync_log").insert({
            "source": "rankedin", "status": "ok",
            "detail": f"{total} kampe fra {len(players)} spillere",
        }).execute()
        return {"ok": True, "synced": total}

    except Exception as e:
        log.exception("RankedIn-sync fejlede")
        db.table("sync_log").insert({
            "source": "rankedin", "status": "error", "detail": str(e),
        }).execute()
        return {"ok": False, "error": str(e)}
    finally:
        await client.aclose()
