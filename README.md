# slayer-bot

A Slack bot for looking up [Slay the Spire 2](https://www.megacrit.com/) cards. Type `[[Card Name]]` in any message and the bot replies with a link to [slaythespire2.gg](https://slaythespire2.gg) that Slack automatically unfurls into a rich card preview.

## Features

- **Bracket syntax** — mention cards with `[[Defend]]`, `[[Eruption]]`, etc.
- **Fuzzy matching** — handles typos and partial names using Levenshtein distance
- **Multiple cards** — `[[Defend]]` and `[[Strike]]` in one message returns both
- **Threaded replies** — responds in-thread in channels, inline in DMs
- **Rich previews** — Slack unfurls the slaythespire2.gg links automatically

## Setup

### Prerequisites

- Node.js
- A [Slack app](https://api.slack.com/apps) with Socket Mode enabled

### Slack App Configuration

1. Enable **Socket Mode** and generate an app-level token with `connections:write` scope
2. Add bot token scopes: `channels:history`, `groups:history`, `chat:write`
3. Subscribe to events: `message.channels`, `message.groups`
4. Install the app to your workspace

### Environment Variables

The app requires two environment variables:

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (`xoxb-...`)
- `SLACK_APP_TOKEN` — App-Level Token with `connections:write` scope (`xapp-...`)

These are configured as variables in [Railway](https://railway.app), which auto-deploys on push to `main`.

### Local Development

```bash
git clone https://github.com/basyl/slayer-bot.git
cd slayer-bot
npm install
```

For local runs, create a `.env` file with the variables above and run `npm start`.

## Updating Game Data

Game data is stored in the `data/` directory. To refresh all data after a game patch:

```bash
npm run scrape:all
```

Or run individual scrapers:

| Command | Description |
|---------|-------------|
| `npm run scrape:cards` | Scrape card data from slaythespire2.gg/cards |
| `npm run scrape:enchantments` | Scrape enchantment data |
| `npm run scrape:enemies` | Scrape enemy data |
| `npm run scrape:events` | Scrape event data |
| `npm run scrape:potions` | Scrape potion data |
| `npm run scrape:relics` | Scrape relic data |
| `npm run scrape:slugs` | Scrape URL slug mappings |

## Project Structure

```
src/
  index.js           # App entry point, Bolt + Socket Mode setup
  listener.js        # Message handler, [[bracket]] regex detection
  lookup.js          # Card name → URL resolution with fuzzy matching
data/
  cards.json         # Card data
  enchantments.json  # Enchantment data
  enemies.json       # Enemy data
  events.json        # Event data
  potions.json       # Potion data
  relics.json        # Relic data
  slugs.json         # Card name → URL slug mapping
scripts/
  scrape-cards.js        # Scraper for cards
  scrape-enchantments.js # Scraper for enchantments
  scrape-enemies.js      # Scraper for enemies
  scrape-events.js       # Scraper for events
  scrape-potions.js      # Scraper for potions
  scrape-relics.js       # Scraper for relics
  scrape-slugs.js        # Scraper for URL slugs
```

## Tech Stack

- [Slack Bolt](https://slack.dev/bolt-js) — Slack app framework
- [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein) — fuzzy string matching
- [Cheerio](https://cheerio.js.org/) — HTML parsing for the scraper
- [Railway](https://railway.app) — hosting and auto-deployment
