import type { ChatInputCommand } from '@bot/structures/interfaces';

import { guild_1010726453974925402 } from './1010726453974925402';

export type GuildSlashCommands = {
  id: string;
  commands: ChatInputCommand[];
};

const guildSlashCommands: GuildSlashCommands[] = [
  {
    id: '1010726453974925402',
    commands: guild_1010726453974925402,
  },
];

export default guildSlashCommands;
