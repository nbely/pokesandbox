import { Client, GatewayIntentBits, Partials, Routes } from "discord.js";
import { REST } from "@discordjs/rest";

import { commands } from "./commands";
import ready from "./events/ready";
import interactionCreate from "./events/interactionCreate";

console.log("SandBot is initializing...");
const TOKEN = process.env.POKE_SANDBOT_TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const GUILD_ID = process.env.GUILD_ID as string;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

const rest = new REST({ version: '10' }).setToken(TOKEN)

ready(client);
interactionCreate(client);

async function main() {
  try {
    console.log('Started refreshing application (/) commands');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands.map(command => command.command.toJSON()),
    });
    console.log('Finished refreshing application (/) commands');

    client.login(TOKEN);
    console.log("Sandbot is logging in...");
  } catch (error) {
    console.log(error);
  }
}

main();
