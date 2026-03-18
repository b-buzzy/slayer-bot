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

async function getPotionSlugs() {
  console.log("Fetching potion slugs...");
  const html = await fetchPage(`${BASE_URL}/potions`);
  const slugs = [];
  const matches = html.matchAll(/href="\/potions\/([^"]+)"/g);
  for (const match of matches) {
    if (!slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }
  console.log(`Found ${slugs.length} potions`);
  return slugs;
}

function parsePotionPage(html, slug) {
  const $ = cheerio.load(html);
  const pageHtml = $.html();

  const potion = {
    slug,
    name: "",
    description: "",
    rarity: "",
    usage: "",
  };

  // Extract from embedded JSON data
  const dataMatch = pageHtml.match(
    /\\"id\\":\\"([^"]*)\\"[^}]*\\"name\\":\\"([^"]*)\\"[^}]*\\"description\\":\\"([^"]*)\\"[^}]*\\"rarity\\":\\"([^"]*)\\"[^}]*\\"usage\\":\\"([^"]*)\\"/
  );

  if (dataMatch) {
    potion.name = dataMatch[2];
    potion.description = cleanText(dataMatch[3]);
    potion.rarity = dataMatch[4];
    potion.usage = dataMatch[5];
  }

  // Fallback: get name from h1
  if (!potion.name) {
    potion.name = $("h1").first().text().trim();
  }

  return potion;
}

async function scrapePotions() {
  const slugs = await getPotionSlugs();
  const potions = {};
  let processed = 0;

  for (const slug of slugs) {
    try {
      const html = await fetchPage(`${BASE_URL}/potions/${slug}`);
      const potion = parsePotionPage(html, slug);
      potions[potion.name.toLowerCase()] = potion;
      processed++;

      if (processed % 25 === 0) {
        console.log(`Progress: ${processed}/${slugs.length}`);
      }
    } catch (err) {
      console.error(`Error scraping ${slug}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY);
  }

  console.log(`\nScraped ${processed} potions`);

  const outPath = path.join(__dirname, "..", "data", "potions.json");
  fs.writeFileSync(outPath, JSON.stringify(potions, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapePotions().catch(console.error);
