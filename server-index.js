/* ============================================================
   PEAKFORM — strežnik (Cloud Run)
   1) AI proxy: Gemini prek TVOJEGA ključa (prijava + Pro/kvota)
   2) Strava OAuth "na en klik": žetoni uporabnikov v Firestore,
      aplikacija nikoli ne vidi skrivnosti
   ============================================================ */
const express = require("express");
const admin = require("firebase-admin");
const crypto = require("crypto");

const {
  GEMINI_API_KEY,                    // OBVEZNO: tvoj Gemini ključ
  DEFAULT_MODEL = "gemini-flash-latest",
  ALLOWED_ORIGINS = "https://poni-9.github.io,http://localhost:8080,http://127.0.0.1:8080",
  FREE_CALLS_PER_DAY = "10",
  STRAVA_CLIENT_ID = "",             // iz strava.com/settings/api
  STRAVA_CLIENT_SECRET = "",         // skrivnost — samo na strežniku
  APP_URL = "https://poni-9.github.io/forma-app/forma-trener.html",
  PORT = 8080,
} = process.env;

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(express.json({ limit: "12mb" }));

const origins = ALLOWED_ORIGINS.split(",").map(s => s.trim());
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && origins.includes(o)) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

async function requireUser(req, res) {
  const h = req.headers.authorization || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!tok) { res.status(401).json({ error: "prijava_potrebna" }); return null; }
  try { return await admin.auth().verifyIdToken(tok); }
  catch { res.status(401).json({ error: "neveljaven_token" }); return null; }
}

async function isPro(uid) {
  try { const d = await db.collection("formaSync").doc(uid).get();
        return d.exists && d.data().pro === true; }
  catch { return false; }
}

async function meter(uid) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.collection("aiUsage").doc(`${uid}_${day}`);
  const limit = parseInt(FREE_CALLS_PER_DAY, 10);
  const snap = await ref.get();
  const used = snap.exists ? (snap.data().n || 0) : 0;
  if (used >= limit) return false;
  await ref.set({ n: used + 1, t: Date.now() }, { merge: true });
  return true;
}

/* ---------------- Gemini proxy ---------------- */
app.post("/api/gemini", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY ni nastavljen" });
    const user = await requireUser(req, res); if (!user) return;

    const pro = await isPro(user.uid);
    if (!pro && !(await meter(user.uid)))
      return res.status(402).json({ error: "limit", message: "Brezplačna dnevna AI kvota porabljena — nadgradi na Pro." });

    const model = (req.body.model || DEFAULT_MODEL).replace(/[^a-z0-9.\-]/gi, "");
    const body = req.body.body;
    if (!body || !body.contents) return res.status(400).json({ error: "manjka body.contents" });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify(body) });

    const text = await r.text();
    db.collection("aiLog").add({ uid: user.uid, pro, model, ok: r.ok, status: r.status, t: Date.now() }).catch(()=>{});
    res.status(r.status).type("application/json").send(text);
  } catch (e) { res.status(500).json({ error: String(e.message || e).slice(0, 200) }); }
});

/* ---------------- Strava OAuth (en klik) ---------------- */
const sign = u => crypto.createHmac("sha256", STRAVA_CLIENT_SECRET || "x").update(String(u)).digest("hex").slice(0, 32);

// začetek: aplikacija pošlje Firebase idToken (?t=) → preusmeritev na Strava soglasje
app.get("/strava/auth", async (req, res) => {
  try {
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) return res.status(500).send("Strava ni nastavljena na strežniku.");
    const tok = req.query.t;
    if (!tok) return res.status(400).send("manjka t");
    let uid;
    try { uid = (await admin.auth().verifyIdToken(String(tok))).uid; }
    catch { return res.status(401).send("neveljaven token — prijavi se znova"); }
    const state = uid + "." + sign(uid);
    const cb = `https://${req.get("host")}/strava/callback`;
    const url = "https://www.strava.com/oauth/authorize"
      + "?client_id=" + encodeURIComponent(STRAVA_CLIENT_ID)
      + "&response_type=code"
      + "&redirect_uri=" + encodeURIComponent(cb)
      + "&approval_prompt=auto&scope=activity:read_all"
      + "&state=" + encodeURIComponent(state);
    res.redirect(url);
  } catch (e) { res.status(500).send("napaka: " + String(e.message || e).slice(0, 120)); }
});

// povratek s Strave: koda → žetoni → Firestore → nazaj v aplikacijo
app.get("/strava/callback", async (req, res) => {
  try {
    const { code, state: st, error } = req.query;
    if (error || !code) return res.redirect(APP_URL + "?strava=err");
    const parts = String(st || "").split(".");
    const uid = parts[0], sig = parts[1];
    if (!uid || sig !== sign(uid)) return res.redirect(APP_URL + "?strava=err");
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, code, grant_type: "authorization_code" })
    });
    const d = await r.json();
    if (!d.access_token) return res.redirect(APP_URL + "?strava=err");
    await db.collection("stravaTokens").doc(uid).set({
      access: d.access_token, refresh: d.refresh_token, exp: d.expires_at,
      athlete: (d.athlete && ((d.athlete.firstname || "") + " " + (d.athlete.lastname || "")).trim()) || "",
      t: Date.now()
    });
    res.redirect(APP_URL + "?strava=ok");
  } catch (e) { res.redirect(APP_URL + "?strava=err"); }
});

async function stravaToken(uid) {
  const ref = db.collection("stravaTokens").doc(uid);
  const s = await ref.get();
  if (!s.exists) return null;
  const d = s.data();
  if (d.exp * 1000 > Date.now() + 60000) return d.access;
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, grant_type: "refresh_token", refresh_token: d.refresh })
  });
  const nd = await r.json();
  if (!nd.access_token) return null;
  await ref.set({ access: nd.access_token, refresh: nd.refresh_token || d.refresh, exp: nd.expires_at }, { merge: true });
  return nd.access_token;
}

app.get("/strava/status", async (req, res) => {
  const u = await requireUser(req, res); if (!u) return;
  try {
    const s = await db.collection("stravaTokens").doc(u.uid).get();
    res.json({ connected: s.exists, athlete: s.exists ? (s.data().athlete || "") : "" });
  } catch (e) { res.status(500).json({ error: "napaka" }); }
});

app.get("/strava/activities", async (req, res) => {
  try {
    const u = await requireUser(req, res); if (!u) return;
    const tk = await stravaToken(u.uid);
    if (!tk) return res.status(409).json({ error: "ni_povezave" });
    const after = parseInt(req.query.after, 10) || Math.floor(Date.now() / 1000 - 120 * 86400);
    let out = [];
    for (let page = 1; page <= 3; page++) {
      const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`,
        { headers: { Authorization: "Bearer " + tk } });
      if (!r.ok) return res.status(r.status).json({ error: "strava_" + r.status });
      const arr = await r.json();
      out = out.concat(arr);
      if (!Array.isArray(arr) || arr.length < 100) break;
    }
    res.json(out);
  } catch (e) { res.status(500).json({ error: String(e.message || e).slice(0, 150) }); }
});

app.post("/strava/disconnect", async (req, res) => {
  const u = await requireUser(req, res); if (!u) return;
  try {
    const tk = await stravaToken(u.uid);
    if (tk) await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", headers: { Authorization: "Bearer " + tk } });
  } catch (_) {}
  try { await db.collection("stravaTokens").doc(u.uid).delete(); } catch (_) {}
  res.json({ ok: true });
});

app.get("/health", (_, res) => res.json({ ok: true, model: DEFAULT_MODEL, strava: !!STRAVA_CLIENT_ID }));
app.listen(PORT, () => console.log("[peakform-server] live on :" + PORT));
