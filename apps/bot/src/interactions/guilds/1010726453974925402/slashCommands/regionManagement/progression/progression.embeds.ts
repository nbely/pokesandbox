import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';
import { ProgressionDefinition, Region } from '@shared/models';

export const getManageProgressionMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  region: Region,
  defaultPrompt = 'Manage progression definitions for this region. Enter a progression key to edit, or use the buttons below to add or delete.'
) => {
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
        progression.kind === 'boolean'
          ? 'Flag'
          : progression.kind.charAt(0).toUpperCase() +
            progression.kind.slice(1);
      progressionLines.push(`\n**${progression.displayName}** (${kindLabel})`);
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
    })
    .setTimestamp();

  if (menu.thumbnail) {
    embed.setThumbnail(menu.thumbnail);
  }

  return [embed];
};

export const getSelectProgressionTypeEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  defaultPrompt = 'Select a progression type for the new progression definition.'
) => {
  const region = await Region.findById(regionId);

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region?.name} - New Progression Definition`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(menu.prompt || defaultPrompt)
      .addFields([
        {
          name: '1️⃣ Numeric',
          value: 'Track a numeric value with optional min/max bounds',
          inline: false,
        },
        {
          name: '2️⃣ Flag (Boolean)',
          value: 'Track a simple on/off binary state',
          inline: false,
        },
        {
          name: '3️⃣ Milestone',
          value: 'Track achievement of discrete milestones',
          inline: false,
        },
      ])
      .setTimestamp(),
  ];
};

export const getEditProgressionDefinitionEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  region: Region,
  progression: ProgressionDefinition,
  editField?: string
) => {
  if (editField) {
    switch (editField) {
      case 'displayName':
        menu.prompt = 'Enter a new display name.';
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
      name: 'Display Name',
      value: progression.displayName,
      inline: true,
    },
    {
      name: 'Visibility',
      value: progression.visibility,
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
      {
        name: 'Milestones',
        value: progression.milestones?.length
          ? progression.milestones.map((m) => `• ${m.label}`).join('\n')
          : 'None',
        inline: false,
      }
    );
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region?.name} - Edit "${progression.displayName}" Progression`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        menu.prompt ||
          'Edit the progression definition. Use the buttons below to modify properties.'
      )
      .addFields(fields)
      .setTimestamp(),
  ];
};
