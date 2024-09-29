import type { ChatInputCommand } from '@bot/structures/interfaces';

import guildSlashCommands, { type GuildSlashCommands } from './guilds';

export type { GuildSlashCommands };

export const slashCommands: {
  globalSlashCommands: ChatInputCommand[];
  guildSlashCommands: GuildSlashCommands[];
} = {
  globalSlashCommands: [],
  guildSlashCommands,
};
