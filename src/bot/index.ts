import { Client, Collection, GatewayIntentBits, Partials, Routes } from "discord.js";
import { REST } from "@discordjs/rest";

import slashCommandsManager, { SlashCommand } from "./structures/managers/slashCommands";
import ready from "./events/ready";
import interactionCreate from "./events/interactionCreate";
import { StringSelectMenu } from "./structures/managers/stringSelectMenus";
import { UserSelectMenu } from "./structures/managers/userSelectMenus";

export class BotClient extends Client {
  // commands = new Collection<string, Command>();
  // commandAliases = new Collection<string, Command>();
  // events = new Collection<string, BotEvent>();
  // buttons = new Collection<string, ButtonCommand>();
  stringSelectMenus = new Collection<string, StringSelectMenu>();
  userSelectMenus = new Collection<string, UserSelectMenu>();
  // modalForms = new Collection<string, ModalForm>();
  slashCommands = new Collection<string, SlashCommand>();
}

(async () => {

  const CLIENT_ID = process.env.CLIENT_ID as string;
  const TOKEN = process.env.POKE_SANDBOT_TOKEN as string;
  const GUILD_ID = process.env.GUILD_ID as string; // Remove for Production

  console.log("SandBot is initializing...");

  const client = new BotClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent, // Only for bots with message content intent access.
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildInvites,
    ],
    partials: [Partials.Channel],
  });


  ready(client);
  interactionCreate(client);

  const rootPath: string = __dirname;
  await slashCommandsManager(client, rootPath)
  client.login(TOKEN);
}
)();