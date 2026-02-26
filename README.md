# PokeSandbox - The Discord Pokémon Fan-Game Engine

Navigation: [Discord Server][1] | [Pokémon Showdown Fork][3]

## Introduction

**What exactly is the PokeSandbox?**

- PokeSandbox is a node.js application that interfaces with the Discord API to provide custom responses to user-entered commands for server-owners to craft their own fan-game directly in Discord, and to then deploy their game to their server users to enjoy.

**What else does it do or will it do?**

- PokeSandbox includes a React-based web-application. This web application will allow for log-in using Discord Oauth account verification. There, users can use server discovery to see what servers/games are publically available to play. In addition, profile data for each of a user's characters on every server will be avaialble for viewing and updating.

- PokeSandobx interacts integrally with a customized Pokémon Showdown forked repository. For now, custom Pokemon, Types, Moves and Abilities need to be developed, reviewed, and approved for merging into the controlled Showdown Fork. Future plans would attempt to allow for these custom additions without direct code updates.

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

| Prerequisite        | Version      | Notes                                                       |
| ------------------- | ------------ | ----------------------------------------------------------- |
| [Node.js][6]        | **18.x LTS** | The project targets Node 18. Using [nvm][7] is recommended. |
| [npm][8]            | 9+           | Bundled with Node 18                                        |
| [Docker Desktop][9] | Latest       | Required to run the local MongoDB instance                  |
| [Git][10]           | Latest       |                                                             |

> **Note:** Node.js 20+ may work but is not officially targeted. Check `@types/node` in `package.json` for the pinned version.

### Discord Bot

You must register your own Discord application and bot in order to run the bot locally.

1. Go to the [Discord Developer Portal][11] and create a **New Application**.
2. Navigate to the **Bot** tab and click **Add Bot**.
3. Under the Bot tab, enable the following **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent
4. On the **OAuth2 → URL Generator** page, generate an invite URL with the `bot` scope and the necessary permissions, then add the bot to your test server.
5. Copy the **Bot Token** — you will need it for `DISCORD_BOT_TOKEN` in your `.env`.
6. Copy the **Client Secret** (under OAuth2 → General) — you will need it for `AUTH_DISCORD_SECRET`.

See the official [Discord Getting Started guide][12] and [Discord.js guide][13] for more detail.

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

## Development

- The codebase is currently being refactored and carried in from the deprecated [Turq-Bot Repository][3]. Along with converting the project from JavaScript to TypeScript, additional plans to conver the application to a Next.JS application are in the works.
- For those interested in joining the development team, please see the link to the Discord server linked at the top of this README.

## Credits

**Development Team**

- Nick Bely [Chronicler] - Lead of Design & Development

**Other Credits**

- Pokémon Showdown Team - for the Pokémon Battle Simulator Base
- Phoenixsong - for providing base battle calculator algorithms for various game functions.

  - Visit [Altered Origin][4] or the [PhoenixDex][5] for more of her work!

[1]: https://discord.gg/5BSMak3m9V
[2]: https://github.com/nbely/pokemon-showdown#pok%C3%A9mon-showdown
[3]: https://github.com/nbely/turq-bot
[4]: https://alteredorigin.net/
[5]: https://phoenixdex.alteredorigin.net/
[6]: https://nodejs.org/en/download
[7]: https://github.com/nvm-sh/nvm
[8]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[9]: https://www.docker.com/products/docker-desktop/
[10]: https://git-scm.com/downloads
[11]: https://discord.com/developers/applications
[12]: https://discord.com/developers/docs/getting-started
[13]: https://discordjs.guide/preparations/setting-up-a-bot-application.html
