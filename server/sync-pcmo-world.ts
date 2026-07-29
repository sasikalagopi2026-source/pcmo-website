import { randomUUID } from "node:crypto";
import { db } from "./db.js";

const BASE_URL = "https://www.pcmo.world";
const membershipPaths = [
  "/pages/student_membership",
  "/pages/individual_membership",
  "/pages/professional_membership",
  "/pages/corporate_membership",
  "/pages/group_membership",
  "/pages/retiree_membership",
];

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

const meta = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1].trim());
  }
  return "";
};

const fetchPage = async (url: string) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "PCMO-Portal-Content-Sync/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
};

const normalizeUrl = (href: string) => {
  const url = new URL(href, BASE_URL);
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
};

const slugFromUrl = (url: string) =>
  decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const titleFromSlug = (slug: string) =>
  slug.split("-").filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

const extractPrice = (text: string) => {
  const match = text.match(/(?:USD\s*|\$\s*)(\d+(?:\.\d{1,2})?)/i);
  return match ? Number(match[1]) : null;
};

const homepage = await fetchPage(`${BASE_URL}/`);
const courseUrls = [...new Set(
  [...homepage.matchAll(/href=["']([^"']*\/course\/[^"'?#]+)["']/gi)]
    .map((match) => normalizeUrl(match[1])),
)];

await db.execute(`
  CREATE TABLE IF NOT EXISTS membership_plans (
    id CHAR(36) PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    billing_period VARCHAR(80),
    source_url TEXT NOT NULL,
    featured_image TEXT,
    status VARCHAR(80) NOT NULL DEFAULT 'published',
    synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

let coursesSynced = 0;
for (const sourceUrl of courseUrls) {
  const html = await fetchPage(sourceUrl);
  const slug = slugFromUrl(sourceUrl);
  const title = meta(html, "og:title") || titleFromSlug(slug);
  const description = meta(html, "description") || meta(html, "og:description");
  const image = meta(html, "og:image");
  const category = /contract/i.test(`${title} ${description}`) ? "Contract Management" : "Project Management";
  const previewContent = JSON.stringify({ sourceUrl, featuredImage: image || null, syncedFrom: BASE_URL });

  await db.execute(
    `INSERT INTO courses
      (id, title, slug, description, level, duration, credits, category, instructor, price, capacity, status, preview_content)
     VALUES (?, ?, ?, ?, 'Professional', NULL, 0, ?, 'PCMO', 0, 0, 'published', ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), description = VALUES(description), category = VALUES(category),
       instructor = VALUES(instructor), status = 'published', preview_content = VALUES(preview_content)`,
    [randomUUID(), title, slug, description || null, category, previewContent],
  );
  coursesSynced += 1;
}

let plansSynced = 0;
for (const path of membershipPaths) {
  const sourceUrl = normalizeUrl(path);
  let html: string;
  try {
    html = await fetchPage(sourceUrl);
  } catch (error) {
    console.warn(`Skipping membership page: ${error instanceof Error ? error.message : sourceUrl}`);
    continue;
  }
  if (/page not found/i.test(html)) continue;
  const slug = slugFromUrl(sourceUrl);
  const name = (meta(html, "og:title") || titleFromSlug(slug)).replace(/\s*\|\s*PCMO.*$/i, "").trim();
  const description = meta(html, "description") || meta(html, "og:description");
  const image = meta(html, "og:image");
  const price = extractPrice(description);
  const billingPeriod = /month/i.test(description) ? "monthly" : /year|annual/i.test(description) ? "yearly" : null;

  await db.execute(
    `INSERT INTO membership_plans
      (id, slug, name, description, price, currency, billing_period, source_url, featured_image, status, synced_at)
     VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, 'published', NOW())
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), description = VALUES(description), price = VALUES(price),
       billing_period = VALUES(billing_period), source_url = VALUES(source_url),
       featured_image = VALUES(featured_image), status = 'published', synced_at = NOW()`,
    [randomUUID(), slug, name, description || null, price, billingPeriod, sourceUrl, image || null],
  );
  plansSynced += 1;
}

console.log(`PCMO public content synced: ${coursesSynced} courses, ${plansSynced} membership plans.`);
await db.end();
