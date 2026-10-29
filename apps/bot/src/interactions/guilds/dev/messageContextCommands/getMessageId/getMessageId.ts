import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  type MessageContextMenuCommandInteraction,
} from 'discord.js';

import type { BotClient } from '@bot/classes';
import type { IMessageContextCommand } from '@bot/structures/interfaces';

export const GetMessageId: IMessageContextCommand = {
  name: 'get-message-id',
  command: new ContextMenuCommandBuilder()
    .setName('get-message-id')
    .setType(ApplicationCommandType.Message),
  execute: async (
    _client: BotClient,
    interaction: MessageContextMenuCommandInteraction
  ) => {
    await interaction.deferReply({ ephemeral: true });
    const id: string = interaction.targetId;

    await interaction.followUp({
      ephemeral: true,
      content: `The message id is ${id}.`,
    });
  },
};
