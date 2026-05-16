const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DADATA_KEY = process.env.VITE_DADATA_KEY || "";
const DIST = path.join(__dirname, "dist");

// Write runtime env (only anon key; URL is derived from window.location.origin in browser)
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

// Connectivity test at startup
if (supabaseHost) {
  https.get(`https://${supabaseHost}/`, (r) => {
    console.log("Supabase reachable, status:", r.statusCode);
  }).on("error", (e) => {
    console.error("Supabase NOT reachable:", e.code, e.message);
  });
}

http.createServer((req, res) => {
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
  const pathname = new URL(req.url, "http://x").pathname;
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
