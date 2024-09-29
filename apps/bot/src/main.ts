import { GatewayIntentBits, Partials } from 'discord.js';

import { connectDb } from '@shared';

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
  await eventsManager(client);
  await messageCommandsManager(client);
  await modalFormsManager(client);
  await roleSelectMenusManager(client);
  await slashCommandsManager(client);
  await stringSelectMenusManager(client);
  await userSelectMenusManager(client);
  client.login(TOKEN);
});
