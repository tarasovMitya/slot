// Generates dist/rss.xml from blogData.ts at build time
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Read and parse blogData.ts via regex (avoids ts compilation)
const src = readFileSync(resolve(root, "src/pages/blog/blogData.ts"), "utf-8");

const articles = [];
const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]).filter((s) => s !== "string");
const titles = [...src.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]).filter((t) => !t.includes(":"));
const excerpts = [...src.matchAll(/excerpt:\s*"([^"]+)"/g)].map((m) => m[1]);
const dates = [...src.matchAll(/publishedAt:\s*"([^"]+)"/g)].map((m) => m[1]);
const categories = [...src.matchAll(/category:\s*"([^"]+)"/g)].map((m) => m[1]).filter((_, i) => i % 2 === 0);

const SITE = "https://slot-home.ru";

for (let i = 0; i < slugs.length; i++) {
  articles.push({
    slug: slugs[i],
    title: titles[i] || slugs[i],
    excerpt: excerpts[i] || "",
    publishedAt: dates[i] || "2026-01-01",
    category: categories[i] || "Советы",
  });
}

const items = articles
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  .map((a) => {
    const pubDate = new Date(a.publishedAt).toUTCString();
    const url = `${SITE}/blog/${a.slug}`;
    const desc = a.excerpt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const title = a.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <category>${a.category}</category>
    </item>`;
  })
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Slot Home — мастера на дом в Москве</title>
    <link>${SITE}</link>
    <description>Советы по бытовым услугам: сантехника, электрика, уборка, ремонт в Москве</description>
    <language>ru</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

writeFileSync(resolve(root, "dist/rss.xml"), rss, "utf-8");
console.log(`✅ rss.xml generated — ${articles.length} articles`);
