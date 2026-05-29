// One-time script: gets a Google OAuth2 refresh token for GSC API access.
// Run: node scripts/gsc-get-token.mjs
// Requires: GSC_OAUTH_CLIENT_ID and GSC_OAUTH_CLIENT_SECRET env vars
// (create an OAuth2 Desktop App client in GCP → APIs & Services → Credentials)

import { createServer } from "http";
import { exec } from "child_process";

const CLIENT_ID = process.env.GSC_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`
❌ Missing env vars. Set them before running:
   export GSC_OAUTH_CLIENT_ID=...
   export GSC_OAUTH_CLIENT_SECRET=...

How to get them:
  1. GCP → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
  2. Application type: Desktop app → Name: "GSC Auth"
  3. Create → copy Client ID and Client Secret
`);
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3001/oauth2callback";
const SCOPES = "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/webmasters.readonly";

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n🔐 Opening browser for Google authorization...");
console.log("   If browser doesn't open, visit this URL manually:\n");
console.log("   " + authUrl + "\n");

// Open browser
const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
exec(`${openCmd} "${authUrl}"`);

// Start local server to receive the callback
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3001");
  if (url.pathname !== "/oauth2callback") return;

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.end(`<h1>Error: ${error}</h1>`);
    server.close();
    return;
  }

  if (!code) {
    res.end("<h1>No code received</h1>");
    server.close();
    return;
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (tokens.error) {
    res.end(`<h1>Token error: ${tokens.error_description}</h1>`);
    console.error("❌ Token error:", tokens);
    server.close();
    return;
  }

  res.end(`
    <h1>✅ Authorized!</h1>
    <p>You can close this tab. Check your terminal for the refresh token.</p>
  `);

  console.log("\n✅ Authorization successful!\n");
  console.log("📋 Add these to Railway → calc_realize → Variables:\n");
  console.log(`GSC_OAUTH_CLIENT_ID=${CLIENT_ID}`);
  console.log(`GSC_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`GSC_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log(`\n⏱  Access token (expires in ~1h):\n${tokens.access_token}`);

  // Quick test: list GSC sites
  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const sites = await sitesRes.json();
  console.log("\n🌐 GSC sites accessible:", JSON.stringify(sites, null, 2));

  server.close();
  process.exit(0);
});

server.listen(3001, () => {
  console.log("⏳ Waiting for Google callback on http://localhost:3001 ...\n");
});
