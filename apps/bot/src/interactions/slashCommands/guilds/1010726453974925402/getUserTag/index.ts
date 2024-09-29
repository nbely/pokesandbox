import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  type GuildMember,
  type UserContextMenuCommandInteraction,
} from 'discord.js';

import type { BotClient } from '@bot/classes';
import type { IUserContextCommand } from '@bot/structures/interfaces';

export const GetUserTag: IUserContextCommand = {
  name: 'get-user-tag',
  command: new ContextMenuCommandBuilder()
    .setName('get-user-tag')
    .setType(ApplicationCommandType.User),
  execute: async (
    _client: BotClient,
    interaction: UserContextMenuCommandInteraction
  ) => {
    await interaction.deferReply({ ephemeral: true });
    const member: GuildMember | undefined =
      interaction.guild?.members.cache.get(interaction.targetId);

    await interaction.followUp({
      ephemeral: true,
      content: `That is ${member?.user.tag}.`,
    });
  },
};
