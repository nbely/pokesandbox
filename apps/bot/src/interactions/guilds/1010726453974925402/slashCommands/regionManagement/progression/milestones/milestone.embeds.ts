import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';
import { ProgressionDefinition } from '@shared';

import { assertProgressionKind } from '../utils';

export const milestonesMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  progression: ProgressionDefinition
) => {
  assertProgressionKind(progression, 'milestone');

  const embed = new EmbedBuilder()
    .setTitle(`${progression.name} Milestones`)
    .setDescription(
      'Add a new milestone to this progression, or select an existing one to edit or delete.'
    )
    .addFields([
      {
        name: 'Milestones',
        value: progression.milestones?.length
          ? progression.milestones
              .sort((a, b) => {
                if (a.ordinal != null && b.ordinal != null) {
                  return a.ordinal - b.ordinal;
                } else if (a.ordinal != null) {
                  return -1;
                } else if (b.ordinal != null) {
                  return 1;
                } else {
                  return 0;
                }
              })
              .map((m) => `${m.ordinal ? `${m.ordinal}.` : '•'} ${m.label}`)
              .join('\n')
          : 'None',
        inline: false,
      },
    ]);

  if (menu.warningMessage) {
    embed.setFooter({ text: menu.warningMessage });
  }

  return [embed];
};
