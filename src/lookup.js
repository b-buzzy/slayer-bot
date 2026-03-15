const { closest, distance } = require("fastest-levenshtein");
const slugs = require("../data/slugs.json");

const cardNames = Object.keys(slugs);
const BASE_URL = "https://slaythespire2.gg/cards";

// Max levenshtein distance to consider a fuzzy match (scales with input length)
function maxDistance(input) {
  if (input.length <= 3) return 1;
  if (input.length <= 6) return 2;
  return 3;
}

function lookupCard(input) {
  const normalized = input.trim().toLowerCase();

  // Exact match
  if (slugs[normalized]) {
    return { found: true, url: `${BASE_URL}/${slugs[normalized]}`, name: input };
  }

  // Fuzzy match
  const best = closest(normalized, cardNames);
  const dist = distance(normalized, best);

  if (dist <= maxDistance(normalized)) {
    return { found: true, url: `${BASE_URL}/${slugs[best]}`, name: best };
  }

  return { found: false, name: input };
}

module.exports = { lookupCard };
