const { lookupCard } = require("./lookup");

const CARD_PATTERN = /\[\[([^\]]+)\]\]/g;

function formatResult(result) {
  if (!result.found) {
    return `❓ Couldn't find anything called "${result.name}". Check spelling or try the full name.`;
  }

  switch (result.type) {
    case "card": {
      let text = `*${result.name}* (${result.character}) — ${result.cardType}, ${result.energyCost} Energy, ${result.rarity}`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      if (
        result.descriptionUpgraded &&
        result.descriptionUpgraded !== result.description
      ) {
        text += `\n_Upgraded: ${result.descriptionUpgraded.replace(/\n/g, " ")}_`;
      }
      return text;
    }
    case "relic": {
      let text = `*${result.name}* — Relic, ${result.rarity}`;
      if (result.pool) text += ` (${result.pool})`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      return text;
    }
    case "potion": {
      let text = `*${result.name}* — Potion, ${result.rarity}`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      return text;
    }
    case "enemy": {
      let text = `*${result.name}* — Enemy`;
      if (result.hp) text += `, HP: ${result.hp}`;
      if (result.description) {
        text += `\n${result.description.replace(/\n/g, " ")}`;
      }
      return text;
    }
    case "event": {
      let text = `*${result.name}* — Event`;
      if (result.description) {
        // Truncate long event descriptions
        const desc = result.description.replace(/\n/g, " ").replace(/\\ /g, " ");
        text += `\n${desc.length > 200 ? desc.slice(0, 200) + "…" : desc}`;
      }
      return text;
    }
    case "enchantment": {
      let text = `*${result.name}* — Enchantment`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      return text;
    }
    default: {
      return `*${result.name}*\n${result.description || ""}`;
    }
  }
}

function registerListener(app) {
  app.message(CARD_PATTERN, async ({ message, say }) => {
    const matches = [...message.text.matchAll(CARD_PATTERN)];
    if (matches.length === 0) return;

    const results = await Promise.all(
      matches.map((m) => lookupCard(m[1]))
    );
    const lines = results.map(formatResult);

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
