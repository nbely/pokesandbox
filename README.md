# PokeSandbox - The Discord Pokémon Fan-Game Engine

Navigation: [Discord Server][1] | [Pokémon Showdown Fork][2]

## Introduction

**What exactly is PokeSandbox?**

- PokeSandbox is a full-stack TypeScript platform that lets Discord server owners build and deploy custom Pokémon fan-game experiences directly within Discord. Admins create and configure their games through an interactive menu-driven bot interface — defining regions, Pokédexes, progression systems, quests, shops, and more — then deploy them for their server's players to enjoy. No coding or external tools required.

**What else does it do?**

- PokeSandbox includes a Next.js web application with Discord OAuth sign-in. Players can browse the **Server Discovery** page to find publicly listed games, view server and region details, and access player profiles. The web app serves as a companion to the in-Discord gameplay experience.

- PokeSandbox integrates with a customized [Pokémon Showdown][2] fork for its battle system. The fork supports custom Pokémon, Types, Moves, and Abilities. Currently, custom additions require direct merges into the controlled Showdown fork; future plans aim to allow server owners to define these without code changes.

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

| Prerequisite        | Version      | Notes                                                       |
| ------------------- | ------------ | ----------------------------------------------------------- |
| [Node.js][3]        | **22.x LTS** | The project targets Node 22. Using [nvm][4] is recommended. |
| [npm][5]            | 10+          | Bundled with Node 22                                        |
| [Docker Desktop][6] | Latest       | Required to run the local MongoDB instance                  |
| [Git][7]            | Latest       |                                                             |

### Discord Bot

You must register your own Discord application and bot in order to run the bot locally.

1. Go to the [Discord Developer Portal][8] and create a **New Application**.
2. Navigate to the **Bot** tab and click **Add Bot**.
3. Under the Bot tab, enable the following **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent
4. On the **OAuth2 → URL Generator** page, generate an invite URL with the `bot` scope and the necessary permissions, then add the bot to your test server.
5. Copy the **Bot Token** — you will need it for `DISCORD_BOT_TOKEN` in your `.env`.
6. Copy the **Client Secret** (under OAuth2 → General) — you will need it for `AUTH_DISCORD_SECRET`.

See the official [Discord Getting Started guide][9] and [Discord.js guide][10] for more detail.

## Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/nbely/pokesandbox.git
cd pokesandbox
npm install
```

### 2. One-Command Setup

The fastest way to get a fully working local environment is to run the setup script:

```bash
npm run setup
```

This single command will:

1. Copy `.env.example` → `.env` (skips if `.env` already exists)
2. Start the MongoDB 7 Docker container and wait until it is healthy
3. Seed the database with fictional sample data

> **After running `db:setup`** open `.env` and fill in the required values (bot token, Discord OAuth credentials, NextAuth secret, etc.) before starting the bot or web app. See [Environment Variables](#environment-variables) below.

### 3. Manual Setup (step-by-step)

If you prefer to run each step individually:

```bash
# 1. Create your .env file
npm run env-setup

# 2. Start MongoDB (Docker)
npm run db:up

# 3. Seed the database
npm run db:seed
```

### 4. Start the Applications

```bash
# Discord bot (hot-reload)
npm run start:bot

# Next.js web app (hot-reload)
npm run start:app
```

## Environment Variables

After running `npm run env-setup` (or `npm run setup`), open `.env` and fill in:

| Variable              | Description                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URI`        | MongoDB connection string. Pre-filled with the local Docker URI.              |
| `DISCORD_BOT_TOKEN`   | Bot token from the Discord Developer Portal                                   |
| `AUTH_DISCORD_ID`     | ID of your test Discord server                                                |
| `AUTH_DISCORD_SECRET` | OAuth2 Client Secret                                                          |
| `AUTH_SECRET`         | Random secret for NextAuth session encryption (run `openssl rand -base64 32`) |

## Database Scripts

| Script                                     | Description                                                   |
| ------------------------------------------ | ------------------------------------------------------------- |
| `npm run db:up`                            | Start the local MongoDB Docker container                      |
| `npm run db:down`                          | Stop the local MongoDB Docker container                       |
| `npm run db:seed`                          | Drop all collections and re-seed with sample data             |
| `npm run db:reset`                         | Alias for `db:seed` — wipe and re-seed                        |
| `npm run db:export`                        | Export all live local collections back to the JSON seed files |
| `npm run db:export -- --collection=<name>` | Export a single collection (e.g. `regions`)                   |

## Interested in helping?

- For those interested in contributing, please see the link to the Discord server at the top of this README.

## Credits

**Development Team**

- Nick Bely [Chronicler] - Architect, Primary Developer & Team Lead

**Other Credits**

- Pokémon Showdown Team - for the Pokémon Battle Simulator Base
- Phoenixsong - for providing base battle calculator algorithms for various game functions.

  - Visit [Altered Origin][11] or the [PhoenixDex][12] for more of her work!

[1]: https://discord.gg/5BSMak3m9V
[2]: https://github.com/nbely/pokemon-showdown#pok%C3%A9mon-showdown
[3]: https://nodejs.org/en/download
[4]: https://github.com/nvm-sh/nvm
[5]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[6]: https://www.docker.com/products/docker-desktop/
[7]: https://git-scm.com/downloads
[8]: https://discord.com/developers/applications
[9]: https://discord.com/developers/docs/getting-started
[10]: https://discordjs.guide/preparations/setting-up-a-bot-application.html
[11]: https://alteredorigin.net/
[12]: https://phoenixdex.alteredorigin.net/
