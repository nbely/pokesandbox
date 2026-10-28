import { GuildChatInputCommands } from '@bot/structures/interfaces';

import { messageContextCommands } from './messageContextCommands';
import { slashCommands } from './slashCommands';
import { userContextCommands } from './userContextCommands';

const devGuildId = process.env.DEV_GUILD_ID;

if (!devGuildId) {
  throw new Error('DEV_GUILD_ID in env is not set');
}

export const guild_1010726453974925402: GuildChatInputCommands = {
  // Set DEV_GUILD_ID in .env to register these commands in your own test server
  id: devGuildId,
  messageContextCommands,
  slashCommands,
  userContextCommands,
};
