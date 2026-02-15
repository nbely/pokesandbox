import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenu } from '@bot/classes';
import { Region } from '@shared/models';

export const getManageProgressionMenuEmbeds = async (
  menu: AdminMenu,
  regionId: string,
  defaultPrompt = 'Manage progression definitions for this region. Enter a progression key to edit, or use the buttons below to add or delete.'
) => {
  const region = await Region.findById(regionId);
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
      
      const [key, progression] = progressions[i];
      const kindLabel = progression.kind === 'boolean' ? 'Flag' : 
                       progression.kind.charAt(0).toUpperCase() + progression.kind.slice(1);
      progressionLines.push(
        `\n**${key}** (${kindLabel}): ${progression.displayName}`
      );
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
      text: progressions.length > 0 
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

export const getSelectProgressionTypeEmbeds = async (
  menu: AdminMenu,
  regionId: string,
  defaultPrompt = 'Select a progression type for the new progression definition.'
) => {
  const region = await Region.findById(regionId);

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

export const getConfigureProgressionMetadataEmbeds = async (
  menu: AdminMenu,
  regionId: string,
  progressionKey: string,
  kind: string,
  defaultPrompt = 'Configure the progression definition metadata. Enter field values as prompted.'
) => {
  const region = await Region.findById(regionId);

  const fields: EmbedField[] = [];

  if (kind === 'numeric') {
    fields.push(
      {
        name: 'Display Name',
        value: 'Enter a user-facing name for this progression',
        inline: false,
      },
      {
        name: 'Description (optional)',
        value: 'Enter a description (or "skip")',
        inline: false,
      },
      {
        name: 'Visibility',
        value: 'Options: public, discoverable, hidden (default: public)',
        inline: false,
      },
      {
        name: 'Min Value (optional)',
        value: 'Enter a minimum value (or "skip")',
        inline: false,
      },
      {
        name: 'Max Value (optional)',
        value: 'Enter a maximum value (or "skip")',
        inline: false,
      }
    );
  } else if (kind === 'boolean') {
    fields.push(
      {
        name: 'Display Name',
        value: 'Enter a user-facing name for this progression',
        inline: false,
      },
      {
        name: 'Description (optional)',
        value: 'Enter a description (or "skip")',
        inline: false,
      },
      {
        name: 'Visibility',
        value: 'Options: public, discoverable, hidden (default: public)',
        inline: false,
      }
    );
  } else if (kind === 'milestone') {
    fields.push(
      {
        name: 'Display Name',
        value: 'Enter a user-facing name for this progression',
        inline: false,
      },
      {
        name: 'Description (optional)',
        value: 'Enter a description (or "skip")',
        inline: false,
      },
      {
        name: 'Visibility',
        value: 'Options: public, discoverable, hidden (default: public)',
        inline: false,
      },
      {
        name: 'Sequential',
        value: 'Must milestones be completed in order? (yes/no, default: no)',
        inline: false,
      },
      {
        name: 'Milestones',
        value: 'You will configure milestones in the next step',
        inline: false,
      }
    );
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} - Configure "${progressionKey}" (${kind})`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(menu.prompt || defaultPrompt)
      .addFields(fields)
      .setTimestamp(),
  ];
};

export const getEditProgressionDefinitionEmbeds = async (
  menu: AdminMenu,
  regionId: string,
  progressionKey: string
) => {
  const region = await Region.findById(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);

  if (!progression) {
    return [
      new EmbedBuilder()
        .setColor('Red')
        .setDescription(`Progression "${progressionKey}" not found.`)
        .setTimestamp(),
    ];
  }

  const fields: EmbedField[] = [
    {
      name: 'Type',
      value: progression.kind === 'boolean' ? 'Flag' : 
             progression.kind.charAt(0).toUpperCase() + progression.kind.slice(1),
      inline: true,
    },
    {
      name: 'Display Name',
      value: progression.displayName,
      inline: true,
    },
    {
      name: 'Visibility',
      value: progression.visibility || 'public',
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
        name: `${region.name} - Edit "${progressionKey}"`,
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
