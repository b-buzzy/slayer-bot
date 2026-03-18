const { closest, distance } = require("fastest-levenshtein");
const cards = require("../data/cards.json");

const cardNames = Object.keys(cards);
const BASE_URL = "https://slaythespire2.gg/cards";

// Max levenshtein distance to consider a fuzzy match (scales with input length)
function maxDistance(input) {
  if (input.length <= 3) return 1;
  if (input.length <= 6) return 2;
  return 3;
}

function lookupCard(input) {
  const normalized = input.trim().toLowerCase();

  let card;

  // Exact match
  if (cards[normalized]) {
    card = cards[normalized];
  } else {
    // Fuzzy match
    const best = closest(normalized, cardNames);
    const dist = distance(normalized, best);

    if (dist <= maxDistance(normalized)) {
      card = cards[best];
    }
  }

  if (!card) {
    return { found: false, name: input };
  }

  return {
    found: true,
    name: card.name,
    character: card.character,
    cardType: card.cardType,
    rarity: card.rarity,
    energyCost: card.energyCost,
    description: card.description,
    descriptionUpgraded: card.descriptionUpgraded,
    url: `${BASE_URL}/${card.slug}`,
  };
}

module.exports = { lookupCard };
