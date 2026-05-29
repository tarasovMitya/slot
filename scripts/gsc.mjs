// Google Search Console API manager
// Auth priority: OAuth2 refresh token (GSC_REFRESH_TOKEN) > service account (GSC_SERVICE_ACCOUNT_JSON)
// Usage:
//   node scripts/gsc.mjs inspect <url>
//   node scripts/gsc.mjs check-all
//   node scripts/gsc.mjs sitemap
//   node scripts/gsc.mjs report
import { readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { createSign } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SITE_URL = "https://slot-home.ru/";
const PROPERTY = "sc-domain:slot-home.ru";

// ── OAuth2 Refresh Token Auth ──────────────────────────────────────────────
async function getAccessTokenOAuth() {
  const clientId = process.env.GSC_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GSC_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`OAuth refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Service Account JWT Auth ───────────────────────────────────────────────
function base64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

async function getAccessTokenServiceAccount(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const sig = sign.sign(sa.private_key, "base64url");
  const jwt = `${unsigned}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Service account auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Auth router ────────────────────────────────────────────────────────────
async function getAccessToken() {
  if (process.env.GSC_REFRESH_TOKEN && process.env.GSC_OAUTH_CLIENT_ID && process.env.GSC_OAUTH_CLIENT_SECRET) {
    console.log("🔑 Using OAuth2 refresh token");
    return getAccessTokenOAuth();
  }
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    let sa;
    try { sa = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON); } catch {
      console.error("❌ GSC_SERVICE_ACCOUNT_JSON is not valid JSON"); process.exit(1);
    }
    console.log(`🔑 Using service account: ${sa.client_email}`);
    return getAccessTokenServiceAccount(sa);
  }
  console.error("❌ No GSC credentials found. Set either:\n  GSC_REFRESH_TOKEN + GSC_OAUTH_CLIENT_ID + GSC_OAUTH_CLIENT_SECRET\n  or GSC_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

// ── GSC API helpers ────────────────────────────────────────────────────────
async function gscGet(token, path) {
  const res = await fetch(`https://searchconsole.googleapis.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function gscPost(token, path, body) {
  const res = await fetch(`https://searchconsole.googleapis.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── URL Inspection ─────────────────────────────────────────────────────────
async function inspectUrl(token, inspectionUrl) {
  const data = await gscPost(token, "/v1/urlInspection/index:inspect", {
    inspectionUrl,
    siteUrl: SITE_URL,
  });

  if (data.error) return { url: inspectionUrl, error: data.error.message };

  const result = data.inspectionResult;
  const index = result?.indexStatusResult;
  return {
    url: inspectionUrl,
    verdict: index?.verdict ?? "UNKNOWN",
    coverageState: index?.coverageState ?? "—",
    lastCrawl: index?.lastCrawlTime?.split("T")[0] ?? "never",
    robotsTxt: index?.robotsTxtState ?? "—",
    indexing: index?.indexingState ?? "—",
    canonical: index?.googleCanonical ?? "—",
  };
}

// ── Commands ───────────────────────────────────────────────────────────────

// Parse article slugs
function getArticleUrls() {
  const blogSrc = readFileSync(resolve(root, "src/pages/blog/blogData.ts"), "utf-8");
  const slugs = [...blogSrc.matchAll(/slug:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => s !== "string");
  return slugs.map((s) => `https://slot-home.ru/blog/${s}`);
}

async function cmdInspect(token, url) {
  console.log(`\n🔍 Inspecting: ${url}`);
  const r = await inspectUrl(token, url);
  if (r.error) { console.error(`  ❌ Error: ${r.error}`); return; }
  const icon = r.verdict === "PASS" ? "✅" : r.verdict === "FAIL" ? "❌" : "⏳";
  console.log(`  ${icon} Verdict: ${r.verdict}`);
  console.log(`     Status : ${r.coverageState}`);
  console.log(`     Crawled: ${r.lastCrawl}`);
  console.log(`     Robots : ${r.robotsTxt}`);
  if (r.canonical !== r.url && r.canonical !== "—") console.log(`     Canonical → ${r.canonical}`);
}

async function inspectWithRetry(token, url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await inspectUrl(token, url);
    } catch (e) {
      if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      else return { url, error: e.message };
    }
  }
}

async function cmdCheckAll(token) {
  const urls = getArticleUrls();
  console.log(`\n🔍 Checking ${urls.length} article pages...\n`);

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const r = await inspectWithRetry(token, urls[i]);
    results.push(r);
    process.stdout.write(`  ${i + 1}/${urls.length} ${r.verdict ?? "ERR"}\r`);
    await new Promise(res => setTimeout(res, 500));
  }

  const indexed = results.filter((r) => r.verdict === "PASS");
  const notIndexed = results.filter((r) => r.verdict !== "PASS" && !r.error);
  const errors = results.filter((r) => r.error);

  console.log(`\n📊 Coverage report (${new Date().toLocaleDateString("ru-RU")})`);
  console.log(`  ✅ Indexed    : ${indexed.length}`);
  console.log(`  ⏳ Not indexed: ${notIndexed.length}`);
  console.log(`  ❌ Errors     : ${errors.length}`);
  console.log(`  Total         : ${results.length}`);

  if (notIndexed.length > 0) {
    console.log("\n⏳ Not yet indexed:");
    for (const r of notIndexed) {
      console.log(`  ${r.url.replace("https://slot-home.ru", "")} — ${r.coverageState} (crawled: ${r.lastCrawl})`);
    }
  }

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const r of errors) console.log(`  ${r.url}: ${r.error}`);
  }
}

async function cmdSitemap(token) {
  console.log("\n📋 Sitemaps for slot-home.ru:");
  const data = await gscGet(token, `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps`);
  if (data.sitemap) {
    for (const s of data.sitemap) {
      console.log(`  ${s.path} — ${s.contents?.[0]?.submitted ?? 0} URLs, errors: ${s.errors ?? 0}`);
    }
  } else {
    console.log("  No sitemaps found (or wrong property URL).");
    console.log("  Trying sc-domain property...");
    const data2 = await gscGet(token, `/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/sitemaps`);
    console.log(JSON.stringify(data2, null, 2));
  }
}

async function cmdReport(token) {
  // Last 30 days search performance
  const body = {
    startDate: new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    dimensions: ["page"],
    rowLimit: 25,
    orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
  };
  const data = await gscPost(
    token,
    `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    body
  );

  if (data.error) {
    console.error("❌ Search analytics error:", data.error.message);
    return;
  }

  console.log(`\n📈 Топ страниц за 30 дней (по кликам):\n`);
  const rows = data.rows ?? [];
  if (rows.length === 0) { console.log("  Данных ещё нет — нужно время для индексации."); return; }

  for (const row of rows) {
    const page = row.keys[0].replace("https://slot-home.ru", "");
    console.log(`  ${page.padEnd(50)} ${String(row.clicks).padStart(4)} кликов   pos ${row.position.toFixed(1)}`);
  }

  const totals = rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
  console.log(`\n  Итого: ${totals.clicks} кликов, ${totals.impressions} показов`);
}

// ── Entry point ────────────────────────────────────────────────────────────
const [, , cmd, arg] = process.argv;

if (!cmd) {
  console.log(`Usage:
  node scripts/gsc.mjs inspect <url>   — inspect a single URL
  node scripts/gsc.mjs check-all       — check all articles
  node scripts/gsc.mjs sitemap         — list submitted sitemaps
  node scripts/gsc.mjs report          — search analytics (last 30 days)
`);
  process.exit(0);
}

const token = await getAccessToken();

switch (cmd) {
  case "inspect":
    if (!arg) { console.error("Provide a URL: node scripts/gsc.mjs inspect <url>"); process.exit(1); }
    await cmdInspect(token, arg);
    break;
  case "check-all":
    await cmdCheckAll(token);
    break;
  case "sitemap":
    await cmdSitemap(token);
    break;
  case "report":
    await cmdReport(token);
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}
