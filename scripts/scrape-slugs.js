const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://slaythespire2.gg";
const CARDS_URL = `${BASE_URL}/cards`;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function scrape() {
  console.log(`Fetching ${CARDS_URL}...`);

  const res = await fetch(CARDS_URL, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const slugs = {};

  // Find all links to individual card pages
  $('a[href^="/cards/"]').each((_, el) => {
    const href = $(el).attr("href");
    const slug = href.replace("/cards/", "").replace(/\/$/, "");

    // Skip the index page link itself
    if (!slug || slug === "") return;

    // Get card name from the img alt attribute (cleanest source)
    // Fall back to first <div> text, then derive from slug
    const $el = $(el);
    let name = $el.find("img").attr("alt") || "";
    if (!name) {
      const firstDiv = $el.find("div").first().text().trim();
      name = firstDiv || slug
        .replace(/-(ironclad|silent|defect|watcher|colorless)$/i, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    const key = name.toLowerCase();

    // First match wins (per spec: return first variant for shared names)
    if (!slugs[key]) {
      slugs[key] = slug;
    }
  });

  const count = Object.keys(slugs).length;
  console.log(`Found ${count} cards.`);

  if (count === 0) {
    console.error("No cards found — the page structure may have changed.");
    process.exit(1);
  }

  const outPath = path.join(__dirname, "..", "data", "slugs.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(slugs, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrape().catch((err) => {
  console.error(err);
  process.exit(1);
});
