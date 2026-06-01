// Generates dist/articles-data.json for server-side blog rendering
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = readFileSync(resolve(root, "src/pages/blog/blogData.ts"), "utf-8");

// Extract ARTICLES array using regex (no TS compiler needed)
const match = src.match(/export const ARTICLES[^=]*=\s*(\[[\s\S]*\]);?\s*$/m) ||
              src.match(/export const ARTICLES[^=]*=\s*(\[[\s\S]+)$/m);

if (!match) {
  console.warn("Could not find ARTICLES export, trying alternative parse...");
  process.exit(0);
}

// Evaluate the array (safe - it's our own source file)
let articlesStr = match[1].trim();
// Remove trailing content after the array
const lastBracket = articlesStr.lastIndexOf("]");
articlesStr = articlesStr.slice(0, lastBracket + 1);

// Replace TypeScript-specific syntax
articlesStr = articlesStr
  .replace(/\/\/[^\n]*/g, "") // remove line comments
  .replace(/as const/g, "")
  .replace(/\btype\s+\w+\s*=/g, "")
  .trim();

let articles;
try {
  articles = eval(articlesStr);
} catch (e) {
  console.warn("Parse error:", e.message.slice(0, 100));
  process.exit(0);
}

// Save minimal version (slug, title, excerpt, metaTitle, metaDescription, sections, category, publishedAt)
const minimal = articles.map(a => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  category: a.category,
  categorySlug: a.categorySlug,
  readTime: a.readTime,
  publishedAt: a.publishedAt,
  metaTitle: a.metaTitle,
  metaDescription: a.metaDescription,
  sections: a.sections,
}));

writeFileSync(resolve(root, "dist/articles-data.json"), JSON.stringify(minimal));
console.log(`✅ Generated articles-data.json: ${minimal.length} articles`);
