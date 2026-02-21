import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';

export const milestonesMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  prompt: string
) => {
  return [
    new EmbedBuilder()
      .setTitle('Create Milestone')
      .setDescription(prompt)
      .addFields([
        {
          name: 'Milestone',
          value: 'Create a new milestone for this progression definition.',
        },
      ]),
  ];
};
