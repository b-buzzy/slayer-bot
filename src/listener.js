const { lookupCard } = require("./lookup");

const CARD_PATTERN = /\[\[([^\]]+)\]\]/g;

function cleanDescription(text) {
  if (!text) return "";
  return text.replace(/\[[^\]]*\]/g, "");
}

function formatResult(result) {
  if (!result.found) {
    return `❓ Couldn't find anything called "${result.name}". Check spelling or try the full name.`;
  }

  switch (result.type) {
    case "card": {
      let text = `<${result.url}|*${result.name}* (${result.character}) — ${result.cardType}, ${result.energyCost} Energy, ${result.rarity}>`;
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
      const pool = result.pool ? ` (${result.pool})` : "";
      let text = `<${result.url}|*${result.name}* — Relic, ${result.rarity}${pool}>`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      return text;
    }
    case "potion": {
      let text = `<${result.url}|*${result.name}* — Potion, ${result.rarity}>`;
      text += `\n${result.description.replace(/\n/g, " ")}`;
      return text;
    }
    case "enemy": {
      const hp = result.hp ? `, HP: ${result.hp}` : "";
      let text = `<${result.url}|*${result.name}* — Enemy${hp}>`;
      if (result.description) {
        text += `\n${result.description.replace(/\n/g, " ")}`;
      }
      return text;
    }
    case "event": {
      let text = `<${result.url}|*${result.name}* — Event>`;
      if (result.options && result.options.length > 0) {
        for (const opt of result.options) {
          text += `\n• *${opt.title}*: ${cleanDescription(opt.description)}`;
        }
      }
      return text;
    }
    case "enchantment": {
      let text = `<${result.url}|*${result.name}* — Enchantment>`;
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
