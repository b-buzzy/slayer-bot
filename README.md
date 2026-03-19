# slayer-bot

A Slack bot for looking up [Slay the Spire 2](https://www.megacrit.com/) game data. Type `[[Name]]` in any message and the bot replies with info about matching cards, relics, potions, enemies, events, or enchantments.

Game data is sourced live from the [Spire Codex](https://spire-codex.com) API — no local data files to maintain, and results stay up to date as the game is patched.

## Features

- **Bracket syntax** — look up anything with `[[Bash]]`, `[[Akabeko]]`, `[[Fire Potion]]`, etc.
- **All item types** — cards, relics, potions, enemies, events, and enchantments
- **Upgraded descriptions** — shows upgraded card text when it differs from the base version
- **Multiple lookups** — `[[Bash]]` and `[[Burning Blood]]` in one message returns both
- **Threaded replies** — responds in-thread in channels, inline in DMs

## Setup

### Prerequisites

- Node.js
- A [Slack app](https://api.slack.com/apps) with Socket Mode enabled

### Slack App Configuration

1. Enable **Socket Mode** and generate an app-level token with `connections:write` scope
2. Add bot token scopes: `channels:history`, `groups:history`, `chat:write`, `im:history`
3. Subscribe to events: `message.channels`, `message.groups`, `message.im`
4. Install the app to your workspace

### Environment Variables

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (`xoxb-...`)
- `SLACK_APP_TOKEN` — App-Level Token with `connections:write` scope (`xapp-...`)

These are configured as variables in [Railway](https://railway.app), which auto-deploys on push to `main`.

### Local Development

```bash
git clone https://github.com/b-buzzy/slayer-bot.git
cd slayer-bot
npm install
```

Create a `.env` file with the variables above and run `npm start`.

## Project Structure

```
src/
  index.js       # App entry point, Bolt + Socket Mode setup
  listener.js    # Message handler, [[bracket]] detection and response formatting
  lookup.js      # Live lookups against the Spire Codex API
scripts/
  test-lookup.js # Quick test script for verifying API lookups
```

## Data Source

All game data comes from the [Spire Codex API](https://spire-codex.com/docs) (60 requests/min, no auth required). Lookups search across six endpoints in parallel:

| Type | Endpoint |
|------|----------|
| Cards | `/api/cards?search=` |
| Relics | `/api/relics?search=` |
| Potions | `/api/potions?search=` |
| Enemies | `/api/monsters?search=` |
| Events | `/api/events?search=` |
| Enchantments | `/api/enchantments?search=` |

## Tech Stack

- [Slack Bolt](https://slack.dev/bolt-js) — Slack app framework
- [Spire Codex](https://spire-codex.com) — Slay the Spire 2 game data API
- [Railway](https://railway.app) — hosting and auto-deployment
