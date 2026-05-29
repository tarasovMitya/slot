// Generates dist/sitemap.xml from blogData.ts at build time
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://slot-home.ru";
const TODAY = new Date().toISOString().split("T")[0];

// Parse blog articles from blogData.ts
const src = readFileSync(resolve(root, "src/pages/blog/blogData.ts"), "utf-8");
const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]).filter((s) => s !== "string");
const dates = [...src.matchAll(/publishedAt:\s*"([^"]+)"/g)].map((m) => m[1]);

const blogUrls = slugs.map((slug, i) => `  <url>
    <loc>${SITE}/blog/${slug}</loc>
    <lastmod>${dates[i] || TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n");

// District slugs (geo pages)
const geoSrc = readFileSync(resolve(root, "src/pages/geo/districtData.ts"), "utf-8");
const districtSlugs = [...geoSrc.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const districtUrls = districtSlugs.map((slug) => `  <url>
    <loc>${SITE}/moscow/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Main -->
  <url><loc>${SITE}/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/calculator</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/blog</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>

  <!-- Services -->
  <url><loc>${SITE}/services/electrician</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/plumber</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/cleaning</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/handyman</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/furniture-assembly</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/dry-cleaning</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/door-installation</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/services/tv-installation</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>

  <!-- Masters (performer SEO) -->
  <url><loc>${SITE}/masters</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/masters/electrician</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/plumber</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/cleaning</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/handyman</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/furniture-assembly</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/tv-installation</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/masters/door-installation</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>

  <!-- Moscow geo hub -->
  <url><loc>${SITE}/moscow</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>

  <!-- Blog articles (${slugs.length} total) -->
${blogUrls}

  <!-- Moscow districts (${districtSlugs.length} total) -->
${districtUrls}

  <!-- Static pages -->
  <url><loc>${SITE}/terms</loc><lastmod>${TODAY}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${SITE}/privacy</loc><lastmod>${TODAY}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${SITE}/contacts</loc><lastmod>${TODAY}</lastmod><changefreq>yearly</changefreq><priority>0.4</priority></url>

</urlset>`;

writeFileSync(resolve(root, "dist/sitemap.xml"), sitemap, "utf-8");
console.log(`✅ sitemap.xml generated — ${slugs.length} blog + ${districtSlugs.length} districts`);
