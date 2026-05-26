const https = require("https");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const DADATA_KEY = process.env.VITE_DADATA_KEY || "";
const DIST = path.join(__dirname, "dist");

fs.writeFileSync(
  path.join(DIST, "runtime-env.js"),
  `window.__env__ = { VITE_SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}', VITE_DADATA_KEY: '${DADATA_KEY}' };\n`
);
console.log("runtime-env.js written, proxying Supabase via /supabase-proxy");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null;
console.log("SUPABASE_URL =", SUPABASE_URL, "| host =", supabaseHost);
console.log("BOT_TOKEN configured:", !!BOT_TOKEN, "| SERVICE_KEY configured:", !!SUPABASE_SERVICE_KEY);

if (supabaseHost) {
  https.get(`https://${supabaseHost}/`, (r) => {
    console.log("Supabase reachable, status:", r.statusCode);
  }).on("error", (e) => {
    console.error("Supabase NOT reachable:", e.code, e.message);
  });
}

// ── Telegram hash verification ─────────────────────────────────────────────
function verifyWidgetHash(fields, botToken) {
  if (!botToken) return false;
  const { hash, ...rest } = fields;
  const checkString = Object.entries(rest)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(checkString).digest("hex");
  return computed === hash;
}

function verifyTmaHash(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false };
  params.delete("hash");
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(checkString).digest("hex");
  const userStr = params.get("user");
  return { valid: computed === hash, user: userStr ? JSON.parse(userStr) : null };
}

// ── Direct PostgreSQL pool (bypasses REST API egress quota) ───────────────
let pgPool = null;
function getPool() {
  if (!pgPool && DATABASE_URL) {
    pgPool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pgPool;
}

async function createTelegramSession(tgId, meta) {
  if (!SUPABASE_JWT_SECRET) throw new Error("SUPABASE_JWT_SECRET not configured");

  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL not configured");

  const email = `tg_${tgId}@slot-home.ru`;
  const userMeta = { ...meta, telegram_id: tgId, provider: "telegram" };

  // Find or create user directly in auth.users (bypasses REST API egress quota)
  const existing = await pool.query(
    "SELECT id, raw_user_meta_data FROM auth.users WHERE email = $1 LIMIT 1",
    [email]
  );

  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    await pool.query(
      "UPDATE auth.users SET raw_user_meta_data = $1, updated_at = now() WHERE id = $2",
      [JSON.stringify(userMeta), userId]
    );
  } else {
    const newId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO auth.users
        (id, email, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, instance_id)
       VALUES ($1, $2, now(), $3, 'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000')`,
      [newId, email, JSON.stringify(userMeta)]
    );
    userId = newId;
  }

  // Sign a Supabase-compatible JWT directly
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    email,
    role: "authenticated",
    aud: "authenticated",
    iat: now,
    exp: now + 60 * 60, // 1 hour
    user_metadata: userMeta,
  };
  const accessToken = jwt.sign(payload, SUPABASE_JWT_SECRET, { algorithm: "HS256" });

  // Store session in auth.sessions so Supabase recognizes it
  const sessionId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO auth.sessions (id, user_id, created_at, updated_at, not_after)
     VALUES ($1, $2, now(), now(), now() + interval '1 hour')
     ON CONFLICT DO NOTHING`,
    [sessionId, userId]
  );

  // Generate refresh token
  const refreshToken = crypto.randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO auth.refresh_tokens (token, user_id, session_id, revoked, created_at, updated_at)
     VALUES ($1, $2, $3, false, now(), now())`,
    [refreshToken, userId, sessionId]
  );

  return { access_token: accessToken, refresh_token: refreshToken, user_id: userId, email };
}

// ── Supabase admin helper (kept for link mode JWT verification) ────────────
function supabaseAdminRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: supabaseHost,
      path: apiPath,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "apikey": SUPABASE_SERVICE_KEY,
        ...(bodyStr && { "Content-Length": Buffer.byteLength(bodyStr) }),
      },
    };
    const req = https.request(opts, (r) => {
      let data = "";
      r.on("data", (chunk) => (data += chunk));
      r.on("end", () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: r.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Telegram auth handler ──────────────────────────────────────────────────
async function handleTelegramAuth(body, authHeader) {
  if (!BOT_TOKEN) throw Object.assign(new Error("BOT_TOKEN not configured"), { status: 500 });
  if (!SUPABASE_SERVICE_KEY) throw Object.assign(new Error("SUPABASE_SERVICE_ROLE_KEY not configured"), { status: 500 });

  // Link mode: attach telegram to existing authenticated account
  if (body.mode === "link") {
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    const userRes = await supabaseAdminRequest("GET", `/auth/v1/admin/users?filter=id.eq.placeholder`, null);
    // Use token verify endpoint to get user
    const verifyRes = await supabaseAdminRequest("GET", "/auth/v1/user", null);
    // Actually verify by calling supabase with the JWT
    const jwtRes = await new Promise((resolve, reject) => {
      const opts = {
        hostname: supabaseHost,
        path: "/auth/v1/user",
        method: "GET",
        headers: { "Authorization": `Bearer ${jwt}`, "apikey": SUPABASE_ANON_KEY },
      };
      const req = https.request(opts, (r) => {
        let data = "";
        r.on("data", (c) => (data += c));
        r.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
      });
      req.on("error", reject);
      req.end();
    });
    if (!jwtRes.id) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;
    if (!hash || !id || !auth_date) throw Object.assign(new Error("Missing fields"), { status: 400 });
    const fields = { id: String(id), first_name: first_name || "", auth_date: String(auth_date), hash };
    if (last_name) fields.last_name = last_name;
    if (username) fields.username = username;
    if (photo_url) fields.photo_url = photo_url;
    if (!verifyWidgetHash(fields, BOT_TOKEN)) throw Object.assign(new Error("Invalid signature"), { status: 401 });

    await supabaseAdminRequest("PUT", `/auth/v1/admin/users/${jwtRes.id}`, {
      user_metadata: {
        ...jwtRes.user_metadata,
        telegram_id: Number(id),
        telegram_username: username || null,
        telegram_name: first_name || null,
      },
    });
    return { success: true };
  }

  // TMA mode
  if (body.initData) {
    const { valid, user } = verifyTmaHash(body.initData, BOT_TOKEN);
    if (!valid) throw Object.assign(new Error("Invalid TMA signature"), { status: 401 });
    if (!user?.id) throw Object.assign(new Error("No user in initData"), { status: 400 });
    const authDate = Number(new URLSearchParams(body.initData).get("auth_date") || "0");
    if (Date.now() / 1000 - authDate > 86400) throw Object.assign(new Error("Auth data expired"), { status: 401 });
    return createTelegramSession(Number(user.id), user);
  }

  // Widget mode
  const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;
  if (!hash || !id || !auth_date) throw Object.assign(new Error("Missing fields"), { status: 400 });
  if (Date.now() / 1000 - Number(auth_date) > 86400) throw Object.assign(new Error("Auth data expired"), { status: 401 });
  const fields = { id: String(id), first_name: first_name || "", auth_date: String(auth_date), hash };
  if (last_name) fields.last_name = last_name;
  if (username) fields.username = username;
  if (photo_url) fields.photo_url = photo_url;
  if (!verifyWidgetHash(fields, BOT_TOKEN)) throw Object.assign(new Error("Invalid signature"), { status: 401 });
  return createTelegramSession(Number(id), { telegram_id: Number(id), first_name, last_name, username, photo_url });
}

// ── HTTP server ────────────────────────────────────────────────────────────
http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://x").pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    });
    return res.end();
  }

  // Telegram auth endpoint — runs on Railway, no Supabase Edge Function needed
  if (req.method === "POST" && pathname === "/api/telegram-auth") {
    let rawBody = "";
    req.on("data", (chunk) => (rawBody += chunk));
    req.on("end", async () => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const body = JSON.parse(rawBody);
        const result = await handleTelegramAuth(body, req.headers.authorization);
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error("[telegram-auth]", e.message);
        res.writeHead(e.status || 500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Proxy Supabase requests through the server (bypasses regional DNS blocking)
  if (req.url.startsWith("/supabase-proxy")) {
    if (!supabaseHost) {
      res.writeHead(503);
      return res.end("VITE_SUPABASE_URL not configured");
    }
    const targetPath = req.url.slice("/supabase-proxy".length) || "/";
    const opts = {
      hostname: supabaseHost,
      path: targetPath,
      method: req.method,
      headers: { ...req.headers, host: supabaseHost },
    };
    const proxy = https.request(opts, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    proxy.on("error", (e) => {
      console.error("Proxy error:", e.message);
      if (!res.headersSent) { res.writeHead(502); res.end("Proxy error"); }
    });
    return req.pipe(proxy);
  }

  // Static file serving
  let file = path.join(DIST, pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, "index.html");
  }
  const ext = path.extname(file);
  const noCache = file.endsWith("runtime-env.js") || file.endsWith("index.html");
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", noCache ? "no-store" : "public, max-age=31536000");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Listening on :${PORT}`));
