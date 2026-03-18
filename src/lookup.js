const { closest, distance } = require("fastest-levenshtein");

// Load all data files
const cards = require("../data/cards.json");
const enchantments = require("../data/enchantments.json");
const enemies = require("../data/enemies.json");
const events = require("../data/events.json");
const potions = require("../data/potions.json");
const relics = require("../data/relics.json");

// Define data sources with their base URLs
const dataSources = [
  { data: cards, baseUrl: "https://slaythespire2.gg/cards", type: "card" },
  { data: enchantments, baseUrl: "https://slaythespire2.gg/enchantments", type: "enchantment" },
  { data: enemies, baseUrl: "https://slaythespire2.gg/enemies", type: "enemy" },
  { data: events, baseUrl: "https://slaythespire2.gg/events", type: "event" },
  { data: potions, baseUrl: "https://slaythespire2.gg/potions", type: "potion" },
  { data: relics, baseUrl: "https://slaythespire2.gg/relics", type: "relic" },
];

// Build a combined index of all items
const allItems = [];
for (const source of dataSources) {
  for (const key of Object.keys(source.data)) {
    allItems.push({
      key,
      item: source.data[key],
      baseUrl: source.baseUrl,
      type: source.type,
    });
  }
}

const allKeys = allItems.map((entry) => entry.key);

// Max levenshtein distance to consider a fuzzy match (scales with input length)
function maxDistance(input) {
  if (input.length <= 3) return 1;
  if (input.length <= 6) return 2;
  return 3;
}

function lookup(input) {
  const normalized = input.trim().toLowerCase();

  let match;

  // Exact match
  match = allItems.find((entry) => entry.key === normalized);

  if (!match) {
    // Fuzzy match
    const best = closest(normalized, allKeys);
    const dist = distance(normalized, best);

    if (dist <= maxDistance(normalized)) {
      match = allItems.find((entry) => entry.key === best);
    }
  }

  if (!match) {
    return { found: false, name: input };
  }

  const { item, baseUrl, type } = match;

  return {
    found: true,
    type,
    name: item.name,
    url: `${baseUrl}/${item.slug}`,
    ...item,
  };
}

// Keep lookupCard for backwards compatibility
function lookupCard(input) {
  return lookup(input);
}

module.exports = { lookup, lookupCard };
