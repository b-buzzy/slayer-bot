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

    const isDM = message.channel_type === "im";

    await say({
      text: lines.join("\n"),
      // In DMs, reply inline (no threading). In channels, reply in-thread.
      ...(isDM ? {} : { thread_ts: message.thread_ts || message.ts }),
      unfurl_links: true,
    });
  });
}

module.exports = { registerListener };
