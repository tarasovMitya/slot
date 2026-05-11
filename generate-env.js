const fs = require("fs");
const url = process.env.VITE_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || "";
fs.writeFileSync(
  "/app/dist/runtime-env.js",
  `window.__env__ = { VITE_SUPABASE_URL: '${url}', VITE_SUPABASE_ANON_KEY: '${key}' };\n`
);
console.log("runtime-env.js written, VITE_SUPABASE_URL =", url);
