const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://slaythespire2.gg";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Rate limiting: delay between requests (ms)
const REQUEST_DELAY = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

function parseCardPage(html, slug) {
  const $ = cheerio.load(html);

  const card = {
    slug,
    name: "",
    character: "",
    cardType: "",
    rarity: "",
    energyCost: "",
    description: "",
  };

  // Extract from JSON-LD structured data (most reliable source)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data["@type"] === "GameItem") {
        if (data.name) card.name = data.name;
        if (data.description) {
          // Clean up the description - remove [gold] and other bracket tags
          card.description = data.description
            .replace(/\[gold\]/g, "")
            .replace(/\[\/gold\]/g, "")
            .replace(/\[.*?\]/g, "");
        }
        if (data.category) card.cardType = data.category;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  });

  // Fallback: get card name from h1
  if (!card.name) {
    const title = $("h1").first().text().trim();
    if (title) card.name = title;
  }

  // Parse the body text to extract details
  const bodyText = $("body").text();

  // Extract details from the page text
  // Pattern: "DetailsRarityBasicEnergy Cost2Card TypeAttackCharacterIronclad"
  const rarityMatch = bodyText.match(/Rarity\s*(Basic|Common|Uncommon|Rare|Special|Starter)/i);
  const energyMatch = bodyText.match(/Energy Cost\s*(\d+|X)/i);
  const typeMatch = bodyText.match(/Card Type\s*(Attack|Skill|Power|Status|Curse)/i);
  const characterMatch = bodyText.match(/Character\s*(Ironclad|Silent|Defect|Watcher|Necrobinder|The Regent|Colorless)/i);

  if (rarityMatch) card.rarity = rarityMatch[1];
  if (energyMatch) card.energyCost = energyMatch[1];
  if (typeMatch && !card.cardType) card.cardType = typeMatch[1];
  if (characterMatch) card.character = characterMatch[1];

  // Fallback: Parse character from slug if not found
  if (!card.character) {
    const slugMatch = slug.match(/-(ironclad|silent|defect|watcher|necrobinder|the-regent|colorless|quest|token|status|curse|event)$/i);
    if (slugMatch) {
      card.character = slugMatch[1]
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  return card;
}

async function scrapeAllCards() {
  // Load existing slugs
  const slugsPath = path.join(__dirname, "..", "data", "slugs.json");
  
  if (!fs.existsSync(slugsPath)) {
    console.error("slugs.json not found. Run `npm run scrape` first to generate it.");
    process.exit(1);
  }

  const slugs = JSON.parse(fs.readFileSync(slugsPath, "utf-8"));
  const slugEntries = Object.entries(slugs);
  const total = slugEntries.length;

  console.log(`Scraping ${total} card pages...`);

  const cards = {};
  let processed = 0;
  let errors = 0;

  for (const [name, slug] of slugEntries) {
    const url = `${BASE_URL}/cards/${slug}`;
    
    try {
      const html = await fetchPage(url);
      const card = parseCardPage(html, slug);
      
      // Use the original name from slugs.json as fallback
      if (!card.name) {
        card.name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }

      cards[name] = card;
      processed++;

      if (processed % 50 === 0) {
        console.log(`Progress: ${processed}/${total} cards scraped...`);
      }
    } catch (err) {
      console.error(`Error scraping ${slug}: ${err.message}`);
      errors++;
      
      // Still add a basic entry so we don't lose track of the card
      cards[name] = {
        slug,
        name: name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        error: err.message,
      };
    }

    // Rate limiting
    await sleep(REQUEST_DELAY);
  }

  console.log(`\nScraped ${processed} cards successfully, ${errors} errors.`);

  // Write output
  const outPath = path.join(__dirname, "..", "data", "cards.json");
  fs.writeFileSync(outPath, JSON.stringify(cards, null, 2) + "\n");
  console.log(`Written to ${outPath}`);
}

scrapeAllCards().catch((err) => {
  console.error(err);
  process.exit(1);
});
