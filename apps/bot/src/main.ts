import { GatewayIntentBits, Partials } from 'discord.js';

import { connectDb } from '@shared/connectDb';
import { MenuEngine } from '@flowcord/v2';

import { BotClient } from '@bot/classes';
import {
  buttonsManager,
  eventsManager,
  messageCommandsManager,
  modalFormsManager,
  roleSelectMenusManager,
  slashCommandsManager,
  stringSelectMenusManager,
  userSelectMenusManager,
} from './structures/managers';

connectDb().then(async () => {
  const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
  console.log('SandBot is initializing...');

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

  await buttonsManager(client);
  await messageCommandsManager(client);
  await modalFormsManager(client);
  await roleSelectMenusManager(client);
  await slashCommandsManager(client);
  await stringSelectMenusManager(client);
  await userSelectMenusManager(client);

  const flowcord = new MenuEngine({ client });
  client.slashCommands.forEach((command, commandName) => {
    if (command.createMenuV2) {
      flowcord.registerMenu(commandName, command.createMenuV2);
    }
  });
  client.flowcord = flowcord;

  await eventsManager(client);
  client.login(TOKEN);
});
