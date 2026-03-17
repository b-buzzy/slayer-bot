# slayer-bot

A Slack bot for looking up [Slay the Spire 2](https://www.megacrit.com/) cards. Type `[[Card Name]]` in any message and the bot replies with a link to [slaythespire2.gg](https://slaythespire2.gg) that Slack automatically unfurls into a rich card preview.

## Features

- **Bracket syntax** — mention cards with `[[Defend]]`, `[[Eruption]]`, etc.
- **Fuzzy matching** — handles typos and partial names using Levenshtein distance
- **Multiple cards** — `[[Defend]] and [[Strike]]` in one message returns both
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

## Updating Card Data

Card slug data is stored in `data/slugs.json`. To refresh it after a game patch:

```bash
npm run scrape
```

This scrapes [slaythespire2.gg/cards](https://slaythespire2.gg/cards) and regenerates the slug mapping.

Card data is stored in `data/cards.json`. To refresh it after a game patch:

```bash
npm run scrape:cards
```

## Project Structure

```
src/
  index.js       # App entry point, Bolt + Socket Mode setup
  listener.js    # Message handler, [[bracket]] regex detection
  lookup.js      # Card name → URL resolution with fuzzy matching
data/
  slugs.json     # Card name → URL slug mapping (~299 cards)
scripts/
  scrape-slugs.js  # Scraper to regenerate slugs.json
```

## Tech Stack

- [Slack Bolt](https://slack.dev/bolt-js) — Slack app framework
- [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein) — fuzzy string matching
- [Cheerio](https://cheerio.js.org/) — HTML parsing for the scraper
- [Railway](https://railway.app) — hosting and auto-deployment
