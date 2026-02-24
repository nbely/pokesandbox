import { EmbedBuilder, type EmbedField } from 'discord.js';
import capitalize from 'lodash/capitalize';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';
import { ProgressionDefinition } from '@shared/models';

import { assertProgressionKind } from './utils';
import assert from 'node:assert';

export const progressionsMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  defaultPrompt = 'Manage progression definitions for this region. Use the buttons below to add or edit a progression.'
) => {
  const region = await menu.getRegion(regionId);
  const progressionLines: string[] = [];

  const progressions = Array.from(region.progressionDefinitions.entries());
  if (progressions.length === 0) {
    progressionLines.push('\nNo progression definitions found.');
  } else {
    for (
      let i = menu.paginationState.startIndex;
      i <= menu.paginationState.endIndex;
      i++
    ) {
      if (i >= progressions.length) break;

      const progression = progressions[i][1];
      const kindLabel =
        progression.kind === 'boolean' ? 'Flag' : capitalize(progression.kind);
      progressionLines.push(`\n**${progression.name}** (${kindLabel})`);
    }
  }

  const fields: EmbedField[] = [];

  if (menu.paginationState.quantity <= 10) {
    fields.push({
      name: '\u200b',
      value: progressionLines.join('') || '\nNo progression definitions found.',
      inline: false,
    });
  } else {
    const half = Math.ceil(menu.paginationState.quantity / 2);
    fields.push({
      name: '\u200b',
      value: progressionLines.slice(0, half).join(''),
      inline: true,
    });
    fields.push({
      name: '\u200b',
      value: progressionLines.slice(half).join(''),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} Progression Manager:`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(menu.prompt || defaultPrompt)
    .addFields(fields)
    .setFooter({
      text:
        progressions.length > 0
          ? `Showing progression${
              menu.paginationState.startIndex === menu.paginationState.endIndex
                ? ''
                : 's'
            } ${menu.paginationState.range} of ${menu.paginationState.total}`
          : 'Use the Add button to create your first progression definition',
    });

  if (menu.thumbnail) {
    embed.setThumbnail(menu.thumbnail);
  }

  return [embed];
};

export const progressionCreateKindMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  defaultPrompt = 'Select a progression type for the new progression definition.'
) => {
  const region = await menu.getRegion(regionId);

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} - New Progression Definition`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(menu.prompt || defaultPrompt)
      .addFields([
        {
          name: '1️⃣ Milestone',
          value:
            'Track achievement of discrete milestones (e.g. Badges for defeating Gyms, Z-Crystals for conquering trials)',
          inline: false,
        },
        {
          name: '2️⃣ Numeric',
          value: 'Track a numeric value (e.g. Battle Tower Points)',
          inline: false,
        },
        {
          name: '3️⃣ Flag',
          value:
            'Track a simple on/off binary state (e.g. Unlocked a new location)',
          inline: false,
        },
      ]),
  ];
};

export const progressionEditMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  progressionKey: string,
  editField?: string
) => {
  const region = await menu.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found.');

  if (editField) {
    switch (editField) {
      case 'name':
        menu.prompt = 'Enter a new name.';
        break;
      case 'description':
        menu.prompt = 'Enter a new description.';
        break;
      case 'visibility':
        menu.prompt = 'Select a new visibility option.';
        break;
      case 'min':
        menu.prompt = 'Enter a new minimum value, or clear the current value';
        break;
      case 'max':
        menu.prompt = 'Enter a new maximum value, or clear the current value';
        break;
    }
  }

  const fields: EmbedField[] = [
    {
      name: 'Type',
      value:
        progression.kind === 'boolean'
          ? 'Flag'
          : progression.kind.charAt(0).toUpperCase() +
            progression.kind.slice(1),
      inline: true,
    },
    {
      name: 'Name',
      value: progression.name,
      inline: true,
    },
    {
      name: 'Visibility',
      value: capitalize(progression.visibility),
      inline: true,
    },
  ];

  if (progression.description) {
    fields.push({
      name: 'Description',
      value: progression.description,
      inline: false,
    });
  }

  if (progression.kind === 'numeric') {
    if (progression.min !== undefined) {
      fields.push({
        name: 'Min',
        value: progression.min.toString(),
        inline: true,
      });
    }
    if (progression.max !== undefined) {
      fields.push({
        name: 'Max',
        value: progression.max.toString(),
        inline: true,
      });
    }
  } else if (progression.kind === 'milestone') {
    fields.push(
      {
        name: 'Sequential',
        value: progression.sequential ? 'Yes' : 'No',
        inline: true,
      },
      buildMilestoneListField(progression)
    );
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region?.name} - Edit "${progression.name}" Progression`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        menu.prompt ||
          'Edit the progression definition. Use the buttons below to modify properties.'
      )
      .addFields(fields),
  ];
};

export const buildMilestoneListField = (
  progression: ProgressionDefinition
): EmbedField => {
  assertProgressionKind('milestone', progression);
  return {
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
  };
};
