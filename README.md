# PADELPIT

Privat padelklub-app (~25 medlemmer). Mobil-først, browserbaseret.
Stack: **FastAPI på Railway · Supabase (auth + data) · React-frontend · MobilePay**.

```
padelpit/
├── backend/            FastAPI-API (deployes til Railway)
│   ├── app/
│   │   ├── main.py             app + CORS + routers
│   │   ├── config.py           env-settings
│   │   ├── database.py         Supabase service-role client
│   │   ├── auth.py             JWT-verifikation + admin-guard
│   │   ├── schemas.py          request/response-modeller
│   │   ├── routers/            auth, events, league, players, dues, rankedin
│   │   └── services/
│   │       └── rankedin_sync.py   ← SKELET, udfyld endpoints
│   ├── requirements.txt
│   ├── Procfile / railway.json
│   └── .env.example
├── supabase/
│   └── schema.sql      tabeller + RLS (kør i Supabase SQL editor)
└── PadelpitApp.jsx     dansk frontend-prototype
```

## Kom i gang

**1. Supabase**
- Opret projekt → kør `supabase/schema.sql` i SQL editor.
- Slå offentlig signup FRA (Authentication → Providers → Email → disable "Enable signups"). Signup går kun via backendens invite-flow.
- Notér `Project URL`, `service_role`-nøgle og `JWT Secret` (Settings → API).

**2. Backend lokalt**
```bash
cd backend
cp .env.example .env          # udfyld værdier
pip install -r requirements.txt
uvicorn app.main:app --reload
# docs: http://localhost:8000/docs
```

**3. Railway**
- Nyt projekt → deploy `backend/` (Nixpacks finder `railway.json`).
- Sæt alle env-vars fra `.env.example`.
- Tilføj et **cron-job** (Railway → Cron) der hver nat kalder sync:
  ```
  curl -X POST https://<din-railway-url>/rankedin/sync -H "X-Sync-Secret: $SYNC_SECRET"
  ```

**4. Frontend**
- Login sker direkte mod Supabase i frontend (`supabase-js`) → giver et JWT.
- Send JWT som `Authorization: Bearer <token>` til backend.
- Byg som PWA så klubben kan "Føj til hjemmeskærm".

## RankedIn — udfyld sync

RankedIn har ingen offentlig API. Sådan kobles den på:

1. Chrome → log ind på rankedin.com → DevTools → Network → Fetch/XHR.
2. Indlæs din profil (`R000169277`) og en ligakamp.
3. Kopiér de relevante kald: fuld URL, query-params, nødvendige headers, og response-JSON.
4. Udfyld `ENDPOINTS` + felt-mapping i `app/services/rankedin_sync.py`.

Indtil da no-op'er sync og logger til `sync_log` — appen kører på cached data.

## MobilePay

v1 = MobilePay-betalingslink/QR pr. periode + manuel "marker som betalt"
(`POST /dues/{id}/pay`). Kræver intet CVR.

Med CVR kan dette skiftes til Vipps MobilePay **Recurring API**: auto-opkrævning
månedligt + webhook der sætter `due_payments.paid` automatisk.

## API-overblik

| Metode | Sti | Adgang |
|---|---|---|
| POST | `/auth/signup` | invite-kode |
| GET  | `/events` | medlem |
| POST | `/events` | admin |
| PUT  | `/events/{id}/rsvp` | medlem |
| GET  | `/league/fixtures` · `/league/results` | medlem |
| GET  | `/players/rankings` · `/players/me` | medlem |
| GET  | `/dues/current` | medlem |
| POST | `/dues/{id}/pay` | medlem |
| POST | `/rankedin/sync` | sync-secret |
| GET  | `/rankedin/status` | medlem |
