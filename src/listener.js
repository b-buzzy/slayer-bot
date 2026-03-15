const { lookupCard } = require("./lookup");

const CARD_PATTERN = /\[\[([^\]]+)\]\]/g;

function registerListener(app) {
  app.message(CARD_PATTERN, async ({ message, say }) => {
    const matches = [...message.text.matchAll(CARD_PATTERN)];
    if (matches.length === 0) return;

    const results = matches.map((m) => lookupCard(m[1]));

    const lines = [];
    for (const result of results) {
      if (result.found) {
        lines.push(result.url);
      } else {
        lines.push(`❓ Couldn't find a card called "${result.name}". Check spelling or try the full name.`);
      }
    }

    const threadTs = message.thread_ts || message.ts;

    await say({
      text: lines.join("\n"),
      thread_ts: threadTs,
      unfurl_links: true,
    });
  });
}

module.exports = { registerListener };
