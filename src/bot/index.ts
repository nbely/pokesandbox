import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

import IButtonCommand from "@structures/interfaces/buttonCommand";
import IBotEvent from "@structures/interfaces/botEvent";
import IMessageCommand from "@structures/interfaces/messageCommand";
import IMessageContextCommand from "@structures/interfaces/messageContextCommand";
import IModalForm from "@structures/interfaces/modalForm";
import ISlashCommand from "@structures/interfaces/slashCommand";
import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";
import IUserContextCommand from "@structures/interfaces/userContextCommand";
import IUserSelectMenu from "@structures/interfaces/userSelectMenu";

import buttonsManager from "@structures/managers/buttons";
import eventsManager from "@structures/managers/events";
import messageCommandsManager from "@structures/managers/messageCommands";
import modalFormsManager from "@structures/managers/modalForms";
import slashCommandsManager from "@structures/managers/slashCommands";
import stringSelectMenusManager from "@structures/managers/stringSelectMenus";
import userSelectMenusManager from "@structures/managers/userSelectMenus";

export class BotClient extends Client {
  buttons = new Collection<string, IButtonCommand>();
  events = new Collection<string, IBotEvent>();
  messageCommands = new Collection<string, IMessageCommand>();
  messageCommandsAliases = new Collection<string, string>();
  modalForms = new Collection<string, IModalForm>();
  userSelectMenus = new Collection<string, IUserSelectMenu>();
  slashCommands = new Collection<string, ISlashCommand
  | IMessageContextCommand
  | IUserContextCommand
  >();
  stringSelectMenus = new Collection<string, IStringSelectMenu>();
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
