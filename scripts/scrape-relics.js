const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://slaythespire2.gg";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const REQUEST_DELAY = 200;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\[gold\]/g, "")
    .replace(/\[\/gold\]/g, "")
    .replace(/\[blue\]/g, "")
    .replace(/\[\/blue\]/g, "")
    .replace(/\[green\]/g, "")
    .replace(/\[\/green\]/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

async function getRelicSlugs() {
  console.log("Fetching relic slugs...");
  const html = await fetchPage(`${BASE_URL}/relics`);
  const slugs = [];
  const matches = html.matchAll(/href="\/relics\/([^"]+)"/g);
  for (const match of matches) {
    if (!slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }
  console.log(`Found ${slugs.length} relics`);
  return slugs;
}

function parseRelicPage(html, slug) {
  const $ = cheerio.load(html);
  const pageHtml = $.html();

  const relic = {
    slug,
    name: "",
    description: "",
    rarity: "",
    pools: [],
  };

  // Extract from embedded JSON data
  const dataMatch = pageHtml.match(
    /\\"id\\":\\"([^"]*)\\"[^}]*\\"name\\":\\"([^"]*)\\"[^}]*\\"description\\":\\"([^"]*)\\"[^}]*\\"rarity\\":\\"([^"]*)\\"[^}]*\\"relicPools\\":\[([^\]]*)\]/
  );

  if (dataMatch) {
    relic.name = dataMatch[2];
    relic.description = cleanText(dataMatch[3]);
    relic.rarity = dataMatch[4];
    const poolsStr = dataMatch[5];
    relic.pools = poolsStr
      .replace(/\\"/g, "")
      .replace(/"/g, "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // Fallback: get name from h1
  if (!relic.name) {
    relic.name = $("h1").first().text().trim();
  }

  return relic;
}

async function scrapeRelics() {
  const slugs = await getRelicSlugs();
  const relics = {};
  let processed = 0;

  for (const slug of slugs) {
    try {
      const html = await fetchPage(`${BASE_URL}/relics/${slug}`);
      const relic = parseRelicPage(html, slug);
      relics[relic.name.toLowerCase()] = relic;
      processed++;

      if (processed % 25 === 0) {
        console.log(`Progress: ${processed}/${slugs.length}`);
      }
    } catch (err) {
      console.error(`Error scraping ${slug}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY);
  }

  console.log(`\nScraped ${processed} relics`);

  const outPath = path.join(__dirname, "..", "data", "relics.json");
  fs.writeFileSync(outPath, JSON.stringify(relics, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapeRelics().catch(console.error);
