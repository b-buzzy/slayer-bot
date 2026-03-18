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

async function getEnemySlugs() {
  console.log("Fetching enemy slugs...");
  const html = await fetchPage(`${BASE_URL}/enemies`);
  const slugs = [];
  const matches = html.matchAll(/href="\/enemies\/([^"]+)"/g);
  for (const match of matches) {
    if (!slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }
  console.log(`Found ${slugs.length} enemies`);
  return slugs;
}

function parseEnemyPage(html, slug) {
  const $ = cheerio.load(html);

  const enemy = {
    slug,
    name: "",
    hp: "",
    notes: "",
    moves: [],
  };

  // Get name from h1
  enemy.name = $("h1").first().text().trim();

  // Get HP from the HP display
  const hpText = $("span:contains('HP')").parent().text();
  const hpMatch = hpText.match(/HP\s*:\s*(.+)/);
  if (hpMatch) {
    enemy.hp = hpMatch[1].trim();
  }

  // Get notes
  const notesSection = $("h2:contains('Notes')").parent();
  const notesText = notesSection.find("p").text();
  if (notesText) {
    enemy.notes = cleanText(notesText);
  }

  // Get moves
  const movesSection = $("h2:contains('Moves')").parent();
  movesSection.find("li").each((_, el) => {
    const moveEl = $(el);
    const moveName = moveEl.find(".font-medium").first().text().trim();
    
    if (moveName) {
      const effects = [];
      moveEl.find("ul li").each((_, effectEl) => {
        const effectText = $(effectEl).text().trim();
        if (effectText) {
          effects.push(cleanText(effectText));
        }
      });

      enemy.moves.push({
        name: moveName.replace(/^\d+\.\s*/, ""),
        effects,
      });
    }
  });

  return enemy;
}

async function scrapeEnemies() {
  const slugs = await getEnemySlugs();
  const enemies = {};
  let processed = 0;

  for (const slug of slugs) {
    try {
      const html = await fetchPage(`${BASE_URL}/enemies/${slug}`);
      const enemy = parseEnemyPage(html, slug);
      enemies[enemy.name.toLowerCase()] = enemy;
      processed++;

      if (processed % 25 === 0) {
        console.log(`Progress: ${processed}/${slugs.length}`);
      }
    } catch (err) {
      console.error(`Error scraping ${slug}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY);
  }

  console.log(`\nScraped ${processed} enemies`);

  const outPath = path.join(__dirname, "..", "data", "enemies.json");
  fs.writeFileSync(outPath, JSON.stringify(enemies, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapeEnemies().catch(console.error);
