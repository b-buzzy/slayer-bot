const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://slaythespire2.gg";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

async function scrapeEnchantments() {
  console.log("Fetching enchantments...");
  const html = await fetchPage(`${BASE_URL}/enchantments`);

  const enchantments = {};

  // Extract enchantment data from the embedded JSON
  // Pattern: {"id":"ENCHANT_NAME","title":"Name","description":"..."}
  const enchantRegex = /\{"id":"([A-Z_]+)","title":"([^"]+)","description":"([^"]*?)","extraCardText":/g;

  let match;
  while ((match = enchantRegex.exec(html)) !== null) {
    const [, id, title, description] = match;
    enchantments[title.toLowerCase()] = {
      slug: id.toLowerCase(),
      name: title,
      description: cleanText(description),
    };
  }

  // Also try escaped JSON format
  const escapedRegex = /\{\\"id\\":\\"([A-Z_]+)\\",\\"title\\":\\"([^"]+)\\",\\"description\\":\\"([^"]*?)\\",\\"extraCardText\\":/g;

  while ((match = escapedRegex.exec(html)) !== null) {
    const [, id, title, description] = match;
    if (!enchantments[title.toLowerCase()]) {
      enchantments[title.toLowerCase()] = {
        slug: id.toLowerCase(),
        name: title,
        description: cleanText(description),
      };
    }
  }

  console.log(`Found ${Object.keys(enchantments).length} enchantments`);

  const outPath = path.join(__dirname, "..", "data", "enchantments.json");
  fs.writeFileSync(outPath, JSON.stringify(enchantments, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapeEnchantments().catch(console.error);
