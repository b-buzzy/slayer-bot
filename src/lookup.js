const API_BASE = "https://spire-codex.com/api";
const SITE_BASE = "https://spire-codex.com";

const ENDPOINTS = [
  { path: "/cards", type: "card" },
  { path: "/relics", type: "relic" },
  { path: "/potions", type: "potion" },
  { path: "/monsters", type: "enemy" },
  { path: "/events", type: "event" },
  { path: "/enchantments", type: "enchantment" },
];

const COLOR_TO_CHARACTER = {
  ironclad: "Ironclad",
  silent: "Silent",
  defect: "Defect",
  watcher: "Watcher",
  necrobinder: "Necrobinder",
  regent: "The Regent",
  colorless: "Colorless",
};

/**
 * Strip BBCode-style tags from spire-codex descriptions
 */
function cleanDescription(text) {
  if (!text) return "";
  return text.replace(/\[[^\]]*\]/g, "");
}

/**
 * Format a card result from the spire-codex API
 */
function formatCardResult(item) {
  const character = COLOR_TO_CHARACTER[item.color] || item.color || "";
  const energyCost =
    item.is_x_cost ? "X" : item.cost != null ? String(item.cost) : "";

  let descriptionUpgraded = "";
  if (item.upgrade && item.description_raw && item.vars) {
    // Build upgraded vars by applying diffs
    // Upgrade keys like "vulnerable" should apply to all matching vars
    // e.g., "vulnerable": "+1" applies to both "Vulnerable" and "VulnerablePower"
    const upgradedVars = { ...item.vars };
    for (const [key, val] of Object.entries(item.upgrade)) {
      if (typeof val !== "string" || !(val.startsWith("+") || val.startsWith("-"))) {
        continue;
      }
      const diff = parseInt(val);
      const keyLower = key.toLowerCase();
      for (const varKey of Object.keys(upgradedVars)) {
        if (varKey.toLowerCase().startsWith(keyLower)) {
          upgradedVars[varKey] = upgradedVars[varKey] + diff;
        }
      }
    }

    // Render the template with upgraded vars
    let rendered = item.description_raw;
    for (const [key, val] of Object.entries(upgradedVars)) {
      // Replace {Key:diff()} or {Key} patterns
      const pattern = new RegExp(
        `\\{${key}(?::diff\\(\\))?\\}`,
        "gi"
      );
      rendered = rendered.replace(pattern, String(val));
    }

    // Handle special upgrade flags
    if (item.upgrade.add_innate) {
      rendered = "Innate.\n" + rendered;
    }
    if (item.upgrade.add_retain) {
      rendered = "Retain.\n" + rendered;
    }

    descriptionUpgraded = cleanDescription(rendered);
  }

  return {
    found: true,
    type: "card",
    name: item.name,
    character,
    cardType: item.type || "",
    energyCost,
    rarity: item.rarity || "",
    description: cleanDescription(item.description),
    descriptionUpgraded,
  };
}

/**
 * Format a relic result from the spire-codex API
 */
function formatRelicResult(item) {
  return {
    found: true,
    type: "relic",
    name: item.name,
    rarity: item.rarity || "",
    pool: item.pool || "",
    description: cleanDescription(item.description),
  };
}

/**
 * Format a potion result from the spire-codex API
 */
function formatPotionResult(item) {
  return {
    found: true,
    type: "potion",
    name: item.name,
    rarity: item.rarity || "",
    description: cleanDescription(item.description),
  };
}

/**
 * Format a monster result from the spire-codex API
 */
function formatMonsterResult(item) {
  return {
    found: true,
    type: "enemy",
    name: item.name,
    description: item.description ? cleanDescription(item.description) : "",
    hp: item.hp_min && item.hp_max ? `${item.hp_min} - ${item.hp_max}` : "",
  };
}

/**
 * Format an event result from the spire-codex API
 */
function formatEventResult(item) {
  return {
    found: true,
    type: "event",
    name: item.name,
    description: cleanDescription(item.description),
    options: item.options || [],
  };
}

/**
 * Format an enchantment result from the spire-codex API
 */
function formatEnchantmentResult(item) {
  return {
    found: true,
    type: "enchantment",
    name: item.name,
    description: cleanDescription(item.description),
  };
}

const FORMATTERS = {
  card: formatCardResult,
  relic: formatRelicResult,
  potion: formatPotionResult,
  enemy: formatMonsterResult,
  event: formatEventResult,
  enchantment: formatEnchantmentResult,
};

/**
 * Search all spire-codex endpoints in parallel for a given query.
 * Returns the first exact name match, or the first result found.
 */
async function lookup(input) {
  const query = input.trim();
  const encoded = encodeURIComponent(query);

  const results = await Promise.all(
    ENDPOINTS.map(async ({ path, type }) => {
      try {
        const res = await fetch(`${API_BASE}${path}?search=${encoded}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((item) => ({ item, type, path }));
      } catch {
        return [];
      }
    })
  );

  const allResults = results.flat();
  if (allResults.length === 0) {
    return { found: false, name: input };
  }

  // Prefer exact name match (case-insensitive)
  const normalized = query.toLowerCase();
  const exact = allResults.find(
    (r) => r.item.name.toLowerCase() === normalized
  );
  const match = exact || allResults[0];
  const url = `${SITE_BASE}${match.path}/${match.item.id.toLowerCase()}`;

  const formatter = FORMATTERS[match.type];
  return { ...formatter(match.item), url };
}

// Keep lookupCard for backwards compatibility
async function lookupCard(input) {
  return lookup(input);
}

module.exports = { lookup, lookupCard };
