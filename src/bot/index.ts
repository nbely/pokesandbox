import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

import buttonsManager, { ButtonCommand } from "@structures/managers/buttons";
import eventsManager, { BotEvent } from "@structures/managers/events";
import messageCommandsManager, { MessageCommand } from "@structures/managers/messageCommands";
import modalFormsManager, { ModalForm } from "@structures/managers/modalForms";
import slashCommandsManager, {
  MessageContextCommand,
  SlashCommand,
  UserContextCommand
} from "@structures/managers/slashCommands";
import stringSelectMenusManager, { StringSelectMenu } from "@structures/managers/stringSelectMenus";
import userSelectMenusManager, { UserSelectMenu } from "@structures/managers/userSelectMenus";

export class BotClient extends Client {
  buttons = new Collection<string, ButtonCommand>();
  events = new Collection<string, BotEvent>();
  messageCommands = new Collection<string, MessageCommand>();
  messageCommandsAliases = new Collection<string, string>();
  modalForms = new Collection<string, ModalForm>();
  userSelectMenus = new Collection<string, UserSelectMenu>();
  slashCommands = new Collection<string, SlashCommand
  | MessageContextCommand
  | UserContextCommand
  >();
  stringSelectMenus = new Collection<string, StringSelectMenu>();
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
  await buttonsManager(client, rootPath);
  await eventsManager(client, rootPath);
  await messageCommandsManager(client, rootPath);
  await modalFormsManager(client, rootPath);
  await stringSelectMenusManager(client, rootPath);
  await slashCommandsManager(client, rootPath);
  await userSelectMenusManager(client, rootPath);
  client.login(TOKEN);
}
)();
