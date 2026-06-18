import React, { useState } from "react";

// ============================================================================
// PADELPIT — privat padelklub-app (mobil-først prototype, mock-data)
// Al UI på dansk. Felter/flows spejler backendens API-former.
// Faner: Aktiviteter · Liga (RankedIn) · Rangliste · Kontingent · Profil
// ============================================================================

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

.pp-root *, .pp-root *::before, .pp-root *::after { box-sizing: border-box; }
.pp-root {
  --ink: #15171B;
  --court: #00B39A;
  --court-deep: #0C2E2B;
  --ball: #CBFF3C;
  --paper: #EFEEE7;
  --card: #FFFFFF;
  --muted: #7C8079;
  --line: #E2E0D6;
  --out: #E26D5A;

  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(0,179,154,0.18), transparent 60%),
    var(--paper);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  -webkit-font-smoothing: antialiased;
}
.pp-phone {
  width: 100%; max-width: 430px; min-height: 100vh;
  background: var(--paper); position: relative;
  display: flex; flex-direction: column;
  box-shadow: 0 0 0 1px var(--line);
}

.pp-top { background: var(--court-deep); color: #EFEEE7; padding: 18px 20px 16px; position: sticky; top: 0; z-index: 20; }
.pp-wordmark { display:flex; align-items:center; gap:9px; }
.pp-wordmark b { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:22px; letter-spacing:0.14em; color:#fff; }
.pp-paddle { width:26px; height:26px; }
.pp-crewline { margin-top:6px; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color: var(--court); font-weight:600; }

.pp-body { flex:1; padding:18px 16px 96px; }
.pp-h { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); margin:4px 2px 12px; display:flex; align-items:center; gap:8px; }
.pp-h .rule { flex:1; height:1px; background:var(--line); }

.pp-card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; margin-bottom:12px; }
.pp-row { display:flex; align-items:center; justify-content:space-between; }

.pp-tag { font-family:'Space Grotesk',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:4px 9px; border-radius:999px; }
.pp-tag.training { background:rgba(0,179,154,0.14); color:#067a6a; }
.pp-tag.match    { background:var(--ball); color:#3a4a00; }
.pp-tag.league   { background:var(--court-deep); color:var(--ball); }
.pp-evt-title { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:18px; margin:10px 0 2px; }
.pp-evt-when  { font-size:13px; color:var(--muted); }

.pp-rsvp { display:flex; gap:8px; margin-top:14px; }
.pp-rsvp button { flex:1; border:1px solid var(--line); background:var(--card); color:var(--ink); font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:12.5px; letter-spacing:0.03em; padding:11px 0; border-radius:11px; cursor:pointer; transition:all .12s; }
.pp-rsvp button.on-in    { background:var(--court); border-color:var(--court); color:#fff; }
.pp-rsvp button.on-maybe { background:#F4EFD6; border-color:#E6DDAE; color:#7a6a14; }
.pp-rsvp button.on-out   { background:var(--out); border-color:var(--out); color:#fff; }

.pp-counts { display:flex; gap:14px; margin-top:12px; font-size:12px; color:var(--muted); }
.pp-counts b { color:var(--ink); font-family:'Space Grotesk',sans-serif; }
.pp-dot { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:5px; }

.pp-sync { display:inline-flex; align-items:center; gap:6px; font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--court); font-weight:600; }
.pp-sync .live { width:6px; height:6px; border-radius:50%; background:var(--court); animation:pp-pulse 1.8s infinite; }
@keyframes pp-pulse { 0%{box-shadow:0 0 0 0 rgba(0,179,154,.5)} 70%{box-shadow:0 0 0 7px rgba(0,179,154,0)} 100%{box-shadow:0 0 0 0 rgba(0,179,154,0)} }

.pp-score { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:20px; letter-spacing:0.04em; }
.pp-score .w { color:var(--court); }
.pp-score .l { color:var(--muted); }

.pp-rank-row { display:flex; align-items:center; gap:12px; padding:11px 4px; border-bottom:1px solid var(--line); }
.pp-rank-row:last-child { border-bottom:none; }
.pp-pos { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:16px; width:26px; text-align:center; color:var(--muted); }
.pp-pos.top { color:var(--court); }
.pp-av { width:38px; height:38px; border-radius:11px; background:var(--court-deep); color:var(--ball); display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; flex-shrink:0; }
.pp-name { font-weight:600; font-size:14.5px; }
.pp-sub { font-size:11.5px; color:var(--muted); }
.pp-pts { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:17px; }
.pp-pts span { font-size:11px; color:var(--muted); font-weight:500; }

.pp-due-amt { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:34px; letter-spacing:0.01em; }
.pp-mp { width:100%; margin-top:14px; border:none; border-radius:12px; padding:14px; background:#5A78FF; color:#fff; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; letter-spacing:0.03em; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:9px; }
.pp-mp:disabled { cursor:default; }
.pp-mp.paid { background:var(--court); }
.pp-ledger-row { display:flex; align-items:center; justify-content:space-between; padding:10px 2px; border-bottom:1px solid var(--line); font-size:13.5px; }
.pp-ledger-row:last-child{ border-bottom:none; }
.pp-pill { font-size:11px; font-weight:600; padding:3px 8px; border-radius:999px; font-family:'Space Grotesk',sans-serif; }
.pp-pill.ok  { background:rgba(0,179,154,0.14); color:#067a6a; }
.pp-pill.due { background:#FBE3DD; color:#b54631; }

.pp-prof-head { display:flex; align-items:center; gap:14px; }
.pp-prof-av { width:60px; height:60px; border-radius:16px; background:var(--court-deep); color:var(--ball); display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:22px; }
.pp-field { display:flex; justify-content:space-between; padding:12px 2px; border-bottom:1px solid var(--line); font-size:13.5px; }
.pp-field:last-child{ border:none; }
.pp-field span { color:var(--muted); }
.pp-field b { font-family:'Space Grotesk',sans-serif; font-weight:600; }

.pp-nav { position:sticky; bottom:0; left:0; right:0; z-index:20; background:rgba(255,255,255,0.92); backdrop-filter:blur(10px); border-top:1px solid var(--line); display:flex; padding:8px 4px 10px; }
.pp-nav button { flex:1; background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px; color:var(--muted); }
.pp-nav button.active { color:var(--court-deep); }
.pp-nav .lbl { font-size:9.5px; font-weight:600; letter-spacing:0.02em; font-family:'Space Grotesk',sans-serif; }
.pp-nav .ic { width:22px; height:22px; }
.pp-nav button.active .ic { color:var(--court); }
`;

// ---- ikoner ----
const Paddle = ({ s = 22 }) => (
  <svg className="pp-paddle" width={s} height={s} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="9" rx="8" ry="9" stroke="var(--ball)" strokeWidth="1.6" />
    <rect x="10.7" y="17" width="2.6" height="5.5" rx="1" fill="var(--ball)" />
    {[6, 9, 12, 15, 18].map((y) =>
      [7, 10, 13, 16].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="var(--court)" />)
    )}
  </svg>
);
const Ic = ({ d }) => (
  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconEvents = () => <Ic d={<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />;
const IconLeague = () => <Ic d={<><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 5H3v2a3 3 0 0 0 2 2.8M19 5h2v2a3 3 0 0 1-2 2.8" /></>} />;
const IconRank = () => <Ic d={<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>} />;
const IconDues = () => <Ic d={<><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></>} />;
const IconProfile = () => <Ic d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />;

// ---------------------------------------------------------------------------
// mock-data
// ---------------------------------------------------------------------------
const ME = { name: "Anders Bonde", initials: "AB", email: "anders@padelpit.dk", rankedin: "R000169277" };

const initialEvents = [
  { id: 1, type: "training", title: "Tirsdagstræning", when: "Tir 18. jun · 19:00 · Padelpit Bane 3", in: 6, maybe: 2, out: 1, my: null },
  { id: 2, type: "match", title: "Åben kampaften", when: "Tor 20. jun · 20:30 · Padelpit Bane 1–2", in: 9, maybe: 1, out: 0, my: null },
  { id: 3, type: "league", title: "Liga: Pit vs. Roskilde PK", when: "Søn 23. jun · 10:00 · Roskilde", in: 4, maybe: 0, out: 0, my: null, synced: true },
];

const fixtures = [
  { id: 1, opp: "Roskilde PK", when: "Søn 23. jun · 10:00", home: false },
  { id: 2, opp: "Greve Padel", when: "Søn 30. jun · 11:30", home: true },
];
const results = [
  { id: 1, opp: "Hvidovre PC", us: 3, them: 1, win: true, when: "9. jun" },
  { id: 2, opp: "Amager Padel", us: 1, them: 3, win: false, when: "2. jun" },
];

const rankings = [
  { pos: 1, n: "Kasper Lund", in: "KL", pts: 1284, w: 18, l: 5 },
  { pos: 2, n: "Anders Bonde", in: "AB", pts: 1210, w: 16, l: 7, me: true },
  { pos: 3, n: "Sofie Dahl", in: "SD", pts: 1188, w: 15, l: 6 },
  { pos: 4, n: "Mette Holm", in: "MH", pts: 1102, w: 13, l: 9 },
  { pos: 5, n: "Frederik Bek", in: "FB", pts: 1040, w: 11, l: 11 },
  { pos: 6, n: "Line Krab", in: "LK", pts: 980, w: 9, l: 12 },
];

const ledger = [
  { n: "Anders Bonde", paid: true }, { n: "Mette Holm", paid: true },
  { n: "Kasper Lund", paid: false }, { n: "Sofie Dahl", paid: true },
  { n: "Frederik Bek", paid: false }, { n: "Line Krab", paid: true },
];

const TYPE_LABEL = { training: "Træning", match: "Åben kamp", league: "Liga" };

// ---------------------------------------------------------------------------
function EventCard({ e, onRsvp }) {
  return (
    <div className="pp-card">
      <div className="pp-row">
        <span className={`pp-tag ${e.type}`}>{TYPE_LABEL[e.type]}</span>
        {e.synced && <span className="pp-sync"><span className="live" />RankedIn</span>}
      </div>
      <div className="pp-evt-title">{e.title}</div>
      <div className="pp-evt-when">{e.when}</div>

      <div className="pp-rsvp">
        <button className={e.my === "in" ? "on-in" : ""} onClick={() => onRsvp(e.id, "in")}>KOMMER</button>
        <button className={e.my === "maybe" ? "on-maybe" : ""} onClick={() => onRsvp(e.id, "maybe")}>MÅSKE</button>
        <button className={e.my === "out" ? "on-out" : ""} onClick={() => onRsvp(e.id, "out")}>AFBUD</button>
      </div>

      <div className="pp-counts">
        <span><i className="pp-dot" style={{ background: "var(--court)" }} /><b>{e.in}</b> kommer</span>
        <span><i className="pp-dot" style={{ background: "#E6DDAE" }} /><b>{e.maybe}</b> måske</span>
        <span><i className="pp-dot" style={{ background: "var(--out)" }} /><b>{e.out}</b> afbud</span>
      </div>
    </div>
  );
}

function Aktiviteter({ events, setEvents }) {
  const onRsvp = (id, choice) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const ne = { ...e };
        if (e.my) ne[e.my] = Math.max(0, ne[e.my] - 1);
        if (e.my === choice) { ne.my = null; return ne; }
        ne[choice] += 1; ne.my = choice; return ne;
      })
    );
  };
  return (
    <>
      <div className="pp-h">Det næste<span className="rule" /></div>
      {events.map((e) => <EventCard key={e.id} e={e} onRsvp={onRsvp} />)}
    </>
  );
}

function Liga() {
  return (
    <>
      <div className="pp-h"><span className="pp-sync"><span className="live" />Hentet fra RankedIn</span><span className="rule" /></div>
      {fixtures.map((f) => (
        <div className="pp-card" key={f.id}>
          <div className="pp-row">
            <div>
              <div className="pp-evt-title" style={{ fontSize: 17 }}>Pit vs. {f.opp}</div>
              <div className="pp-evt-when">{f.when} · {f.home ? "Hjemme" : "Ude"}</div>
            </div>
            <span className="pp-tag league">Kommende</span>
          </div>
        </div>
      ))}
      <div className="pp-h" style={{ marginTop: 20 }}>Resultater<span className="rule" /></div>
      {results.map((r) => (
        <div className="pp-card" key={r.id}>
          <div className="pp-row">
            <div>
              <div className="pp-name">Pit vs. {r.opp}</div>
              <div className="pp-sub">{r.when} · hentet fra RankedIn</div>
            </div>
            <div className="pp-score">
              <span className={r.win ? "w" : "l"}>{r.us}</span>
              <span className="l"> – </span>
              <span style={r.win ? { color: "var(--muted)" } : { color: "var(--out)" }}>{r.them}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function Rangliste() {
  return (
    <>
      <div className="pp-h">Klubbens rangliste<span className="rule" /></div>
      <div className="pp-card" style={{ padding: "6px 14px" }}>
        {rankings.map((p) => (
          <div className="pp-rank-row" key={p.pos} style={p.me ? { background: "rgba(0,179,154,0.06)", borderRadius: 10 } : {}}>
            <div className={`pp-pos ${p.pos <= 3 ? "top" : ""}`}>{p.pos}</div>
            <div className="pp-av">{p.in}</div>
            <div style={{ flex: 1 }}>
              <div className="pp-name">{p.n}{p.me && <span style={{ color: "var(--court)", fontSize: 11 }}> · dig</span>}</div>
              <div className="pp-sub">{p.w}S · {p.l}N</div>
            </div>
            <div className="pp-pts">{p.pts}<span> pt</span></div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", marginTop: 6 }}>
        Point opdateres når ligaresultater synkroniseres.
      </div>
    </>
  );
}

function Kontingent() {
  const [paid, setPaid] = useState(false);
  return (
    <>
      <div className="pp-h">Din andel — juni<span className="rule" /></div>
      <div className="pp-card">
        <div className="pp-sub">Banleje + bolde, delt mellem alle i klubben</div>
        <div className="pp-due-amt">{paid ? "0 kr." : "250 kr."}</div>
        <button className={`pp-mp ${paid ? "paid" : ""}`} onClick={() => setPaid(true)} disabled={paid}>
          {paid ? "✓ Betalt med MobilePay" : "Betal 250 kr. med MobilePay"}
        </button>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
          {paid ? "Kvittering registreret automatisk." : "Åbner MobilePay · betaling bekræftes i appen"}
        </div>
      </div>

      <div className="pp-h" style={{ marginTop: 18 }}>Hvem har betalt<span className="rule" /></div>
      <div className="pp-card" style={{ padding: "6px 14px" }}>
        {ledger.map((l, i) => {
          const isPaid = l.n === "Anders Bonde" ? paid || l.paid : l.paid;
          return (
            <div className="pp-ledger-row" key={i}>
              <span>{l.n}{l.n === "Anders Bonde" && " (dig)"}</span>
              <span className={`pp-pill ${isPaid ? "ok" : "due"}`}>{isPaid ? "betalt" : "mangler"}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Profil() {
  return (
    <>
      <div className="pp-h">Profil<span className="rule" /></div>
      <div className="pp-card">
        <div className="pp-prof-head">
          <div className="pp-prof-av">{ME.initials}</div>
          <div>
            <div className="pp-evt-title" style={{ margin: 0, fontSize: 19 }}>{ME.name}</div>
            <div className="pp-sub">Holdkaptajn · the Pit</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="pp-field"><span>E-mail</span><b>{ME.email}</b></div>
          <div className="pp-field"><span>RankedIn-ID</span><b style={{ color: "var(--court)" }}>{ME.rankedin}</b></div>
          <div className="pp-field"><span>Ligaplacering</span><b>#2 · 1210 pt</b></div>
          <div className="pp-field"><span>Sæson</span><b>16S · 7N</b></div>
        </div>
      </div>
      <div className="pp-card" style={{ textAlign: "center" }}>
        <span className="pp-sync"><span className="live" />RankedIn forbundet</span>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
          Kampe, resultater og point hentes fra din RankedIn-profil.
        </div>
      </div>
    </>
  );
}

export default function PadelpitApp() {
  const [tab, setTab] = useState("akt");
  const [events, setEvents] = useState(initialEvents);

  const tabs = [
    { id: "akt", label: "Aktiviteter", Icon: IconEvents },
    { id: "liga", label: "Liga", Icon: IconLeague },
    { id: "rang", label: "Rangliste", Icon: IconRank },
    { id: "kont", label: "Kontingent", Icon: IconDues },
    { id: "profil", label: "Profil", Icon: IconProfile },
  ];

  return (
    <div className="pp-root">
      <style>{STYLE}</style>
      <div className="pp-phone">
        <header className="pp-top">
          <div className="pp-wordmark"><Paddle s={26} /><b>PADELPIT</b></div>
          <div className="pp-crewline">Kun for medlemmer · 24 i klubben</div>
        </header>

        <main className="pp-body">
          {tab === "akt" && <Aktiviteter events={events} setEvents={setEvents} />}
          {tab === "liga" && <Liga />}
          {tab === "rang" && <Rangliste />}
          {tab === "kont" && <Kontingent />}
          {tab === "profil" && <Profil />}
        </main>

        <nav className="pp-nav">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon />
              <span className="lbl">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
