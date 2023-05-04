import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

import eventsManager, { BotEvent } from "./structures/managers/events";
import slashCommandsManager, { SlashCommand } from "./structures/managers/slashCommands";
import stringSelectMenusManager, { StringSelectMenu } from "./structures/managers/stringSelectMenus";
import userSelectMenusManager, { UserSelectMenu } from "./structures/managers/userSelectMenus";

export class BotClient extends Client {
  // commands = new Collection<string, Command>();
  // commandAliases = new Collection<string, Command>();
  events = new Collection<string, BotEvent>();
  // buttons = new Collection<string, ButtonCommand>();
  stringSelectMenus = new Collection<string, StringSelectMenu>();
  userSelectMenus = new Collection<string, UserSelectMenu>();
  // modalForms = new Collection<string, ModalForm>();
  slashCommands = new Collection<string, SlashCommand>();
}

(async () => {
  const TOKEN = process.env.POKE_SANDBOT_TOKEN as string;
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

  const rootPath: string = __dirname;
  await eventsManager(client, rootPath);
  await stringSelectMenusManager(client, rootPath);
  await userSelectMenusManager(client, rootPath);
  await slashCommandsManager(client, rootPath);
  client.login(TOKEN);
}
)();
