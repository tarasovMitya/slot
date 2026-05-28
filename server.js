const https = require("https");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
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

// ── Supabase admin helper ──────────────────────────────────────────────────
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

async function createTelegramSession(tgId, meta) {
  const email = `tg_${tgId}@slot-home.ru`;
  const userMeta = { ...meta, telegram_id: tgId, provider: "telegram" };

  // generate_link creates user if not exists, or generates link for existing user
  const linkRes = await supabaseAdminRequest("POST", "/auth/v1/admin/generate_link", {
    type: "magiclink",
    email,
    data: userMeta,
  });
  const hashed_token = linkRes.body?.properties?.hashed_token || linkRes.body?.hashed_token;
  if (!hashed_token) throw new Error(`generateLink failed: ${JSON.stringify(linkRes.body)}`);

  const userId = linkRes.body?.properties?.user_id || linkRes.body?.user?.id;
  if (userId) {
    await supabaseAdminRequest("PUT", `/auth/v1/admin/users/${userId}`, {
      user_metadata: userMeta,
    }).catch(() => {});
  }

  return { token_hash: hashed_token, user_id: userId, email };
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
http.createServer(async (req, res) => {
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

  // Bot → server: store Telegram auth session (bot-signed with BOT_TOKEN HMAC)
  if (req.method === "POST" && pathname === "/api/telegram-auth/bot-session") {
    let rawBody = "";
    req.on("data", (chunk) => (rawBody += chunk));
    req.on("end", async () => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const sig = req.headers["x-bot-signature"];
        const expected = crypto.createHmac("sha256", BOT_TOKEN).update(rawBody).digest("hex");
        if (!BOT_TOKEN || sig !== expected) throw Object.assign(new Error("Invalid signature"), { status: 401 });
        const data = JSON.parse(rawBody);
        if (!data.state || !data.telegram_id || !data.code) throw Object.assign(new Error("Missing fields"), { status: 400 });
        const insertRes = await supabaseAdminRequest("POST", "/rest/v1/auth_sessions", {
          state: data.state,
          code: data.code,
          telegram_id: data.telegram_id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          username: data.username || null,
        });
        if (insertRes.status >= 300) throw new Error(`DB insert failed (${insertRes.status}): ${JSON.stringify(insertRes.body)}`);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("[bot-session]", e.message);
        res.writeHead(e.status || 500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Client submits code received from bot → verify and create session
  if (req.method === "GET" && pathname === "/api/telegram-auth/status") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const url = new URL(req.url, "http://x");
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (!state || !/^[a-f0-9]{32}$/.test(state)) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "invalid state" }));
    }
    if (!code || !/^\d{6}$/.test(code)) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "invalid code" }));
    }
    try {
      const sessionRes = await supabaseAdminRequest(
        "GET",
        `/rest/v1/auth_sessions?state=eq.${encodeURIComponent(state)}&select=*&limit=1`,
        null
      );
      const sessions = Array.isArray(sessionRes.body) ? sessionRes.body : [];
      if (sessions.length === 0) {
        res.writeHead(200);
        return res.end(JSON.stringify({ status: "pending" }));
      }
      const session = sessions[0];
      if (session.used_at) {
        res.writeHead(200);
        return res.end(JSON.stringify({ status: "used" }));
      }
      if (session.code !== code) {
        res.writeHead(200);
        return res.end(JSON.stringify({ error: "invalid_code" }));
      }
      const result = await createTelegramSession(session.telegram_id, {
        first_name: session.first_name,
        last_name: session.last_name,
        username: session.username,
      });
      await supabaseAdminRequest(
        "PATCH",
        `/rest/v1/auth_sessions?state=eq.${encodeURIComponent(state)}`,
        { used_at: new Date().toISOString() }
      );
      res.writeHead(200);
      return res.end(JSON.stringify({ status: "ready", ...result }));
    } catch (e) {
      console.error("[telegram-auth/status]", e.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Link Telegram to existing authenticated account
  if (req.method === "GET" && pathname === "/api/telegram-auth/link") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const linkUrl = new URL(req.url, "http://x");
    const state = linkUrl.searchParams.get("state");
    const code = linkUrl.searchParams.get("code");
    const jwt = req.headers.authorization?.replace("Bearer ", "");
    if (!state || !jwt || !code) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "state, code and Authorization required" }));
    }
    try {
      const jwtRes = await new Promise((resolve, reject) => {
        const opts = {
          hostname: supabaseHost,
          path: "/auth/v1/user",
          method: "GET",
          headers: { "Authorization": `Bearer ${jwt}`, "apikey": SUPABASE_ANON_KEY },
        };
        const r2 = https.request(opts, (r) => {
          let data = ""; r.on("data", c => (data += c));
          r.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
        });
        r2.on("error", reject); r2.end();
      });
      if (!jwtRes.id) throw Object.assign(new Error("Unauthorized"), { status: 401 });
      const sessionRes = await supabaseAdminRequest(
        "GET", `/rest/v1/auth_sessions?state=eq.${encodeURIComponent(state)}&select=*&limit=1`, null
      );
      const sessions = Array.isArray(sessionRes.body) ? sessionRes.body : [];
      if (sessions.length === 0) {
        res.writeHead(200);
        return res.end(JSON.stringify({ status: "pending" }));
      }
      const session = sessions[0];
      if (session.used_at) throw Object.assign(new Error("Session already used"), { status: 400 });
      if (session.code !== code) {
        res.writeHead(200);
        return res.end(JSON.stringify({ error: "invalid_code" }));
      }
      await supabaseAdminRequest("PUT", `/auth/v1/admin/users/${jwtRes.id}`, {
        user_metadata: {
          ...jwtRes.user_metadata,
          telegram_id: session.telegram_id,
          telegram_username: session.username || null,
          telegram_name: session.first_name || null,
        },
      });
      await supabaseAdminRequest(
        "PATCH", `/rest/v1/auth_sessions?state=eq.${encodeURIComponent(state)}`,
        { used_at: new Date().toISOString() }
      );
      res.writeHead(200);
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("[telegram-auth/link]", e.message);
      res.writeHead(e.status || 500);
      return res.end(JSON.stringify({ error: e.message }));
    }
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

  // RSS feed for Yandex Dzen / search engines
  if (pathname === "/rss.xml") {
    const rssFile = path.join(DIST, "rss.xml");
    if (fs.existsSync(rssFile)) {
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return fs.createReadStream(rssFile).pipe(res);
    }
    res.writeHead(404);
    return res.end("RSS not found — rebuild required");
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
