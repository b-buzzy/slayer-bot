const { lookupCard } = require("./lookup");

const CARD_PATTERN = /\[\[([^\]]+)\]\]/g;

function formatCard(result) {
  if (!result.found) {
    return `❓ Couldn't find a card called "${result.name}". Check spelling or try the full name.`;
  }

  let text = `<${result.url}|*${result.name}* (${result.character}) — ${result.cardType}, ${result.energyCost} Energy, ${result.rarity}>`;
  text += `\n${result.description.replace(/\n/g, " ")}`;

  if (result.descriptionUpgraded && result.descriptionUpgraded !== result.description) {
    text += `\n_Upgraded: ${result.descriptionUpgraded.replace(/\n/g, " ")}_`;
  }

  return text;
}

function registerListener(app) {
  app.message(CARD_PATTERN, async ({ message, say }) => {
    const matches = [...message.text.matchAll(CARD_PATTERN)];
    if (matches.length === 0) return;

    const results = matches.map((m) => lookupCard(m[1]));
    const lines = results.map(formatCard);

    const isDM = message.channel_type === "im";

    await say({
      text: lines.join("\n\n"),
      // In DMs, reply inline (no threading). In channels, reply in-thread.
      ...(isDM ? {} : { thread_ts: message.thread_ts || message.ts }),
      unfurl_links: false,
    });
  });
}

module.exports = { registerListener };
