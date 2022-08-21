import { Client, GatewayIntentBits, Partials } from "discord.js";
import interactionCreate from "./events/interactionCreate";
import ready from "./events/ready";

console.log("Bot is starting...");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
});

ready(client);
interactionCreate(client);

client.login(process.env.POKE_SANDBOT_TOKEN);
