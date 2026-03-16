import { EmbedBuilder, type EmbedField } from 'discord.js';
import capitalize from 'lodash/capitalize';
import assert from 'node:assert';

import type { AdminMenuContext } from '@bot/classes';
import { createNumericListFields } from '@bot/embeds/utils/createNumericListFields';
import { paginateListForButtonPagination } from '@bot/embeds/utils/paginateListForButtonPagination';
import { sortByOrdinal } from '@bot/utils';
import { ProgressionDefinition } from '@shared/models';

import type { ProgressionEditMenuState, ProgressionsMenuState } from './types';
import { assertProgressionKind, getOrderedProgressionEntries } from './utils';

export const progressionsMenuEmbeds = async (
  ctx: AdminMenuContext<ProgressionsMenuState>,
  regionId: string,
  defaultPrompt = 'Manage progression definitions for this region. Use the buttons below to add or edit a progression.'
) => {
  const region = await ctx.admin.getRegion(regionId);
  const orderedProgressions = getOrderedProgressionEntries(
    region.progressionDefinitions
  );

  const progressionGlobalIndexByKey = new Map<string, number>(
    orderedProgressions.map(([key], index) => [key, index + 1])
  );

  const pagination = ctx.pagination;
  const {
    totalItems: quantity,
    footerText,
    visibleItems: visibleProgressions,
  } = paginateListForButtonPagination(orderedProgressions, pagination, {
    itemLabel: 'progression',
  });

  const visibleByKind = {
    milestone: visibleProgressions.filter(
      ([, progression]) => progression.kind === 'milestone'
    ),
    numeric: visibleProgressions.filter(
      ([, progression]) => progression.kind === 'numeric'
    ),
    boolean: visibleProgressions.filter(
      ([, progression]) => progression.kind === 'boolean'
    ),
  };

  const fields: EmbedField[] = [];

  if (quantity === 0) {
    fields.push({
      name: '\u200b',
      value: '\nNo progression definitions found.',
      inline: false,
    });
  } else {
    const addKindRow = (
      label: string,
      kindProgressions: Array<[string, ProgressionDefinition]>
    ) => {
      if (kindProgressions.length === 0) return;

      const kindFields = createNumericListFields(
        kindProgressions.map(([key, progression]) => ({
          name: progression.name,
          index: progressionGlobalIndexByKey.get(key),
        })),
        [{ threshold: 1, columns: 3 }],
        true,
        `No ${label} progressions found.`
      );

      for (const [index, field] of kindFields.entries()) {
        fields.push({
          ...field,
          name: index === 0 ? label : '\u200b',
        });
      }

      const remainder = kindFields.length % 3;
      if (remainder !== 0) {
        const fillerCount = 3 - remainder;
        for (let i = 0; i < fillerCount; i++) {
          fields.push({
            name: '\u200b',
            value: '\u200b',
            inline: true,
          });
        }
      }
    };

    addKindRow('Milestones', visibleByKind.milestone);
    addKindRow('Numerics', visibleByKind.numeric);
    addKindRow('Flags', visibleByKind.boolean);
  }

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} Progression Manager:`,
      iconURL: ctx.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(ctx.state.get('prompt') || defaultPrompt)
    .addFields(fields)
    .setFooter({
      text:
        orderedProgressions.length > 0
          ? footerText ?? `Showing progression 1 of ${quantity}`
          : 'Use the Add button to create your first progression definition',
    });

  return [embed];
};

export const progressionEditMenuEmbeds = async (
  ctx: AdminMenuContext<ProgressionEditMenuState>,
  regionId: string,
  progressionKey: string,
  editField?: string
) => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found.');

  let prompt = ctx.state.get('prompt');
  if (editField) {
    switch (editField) {
      case 'name':
        prompt = 'Enter a new name.';
        break;
      case 'description':
        prompt = 'Enter a new description.';
        break;
      case 'visibility':
        prompt = 'Select a new visibility option.';
        break;
      case 'min':
        prompt = 'Enter a new minimum value, or clear the current value';
        break;
      case 'max':
        prompt = 'Enter a new maximum value, or clear the current value';
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
        inline: false,
      },
      ...buildMilestoneListFields(progression)
    );
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region?.name} - Edit "${progression.name}" Progression`,
        iconURL: ctx.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        prompt ||
          'Edit the progression definition. Use the buttons below to modify properties.'
      )
      .addFields(fields),
  ];
};

export const buildMilestoneListFields = (
  progression: ProgressionDefinition,
  useNumericEmojis = false
): EmbedField[] => {
  assertProgressionKind('milestone', progression);
  const fields = createNumericListFields(
    sortByOrdinal(progression.milestones).map((milestone) => ({
      name: milestone.label,
      index: milestone.ordinal,
    })),
    [{ threshold: 1, columns: 3 }],
    useNumericEmojis,
    'No milestones found.'
  );

  return fields.map((field, index) => ({
    ...field,
    name: index === 0 ? 'Milestones' : '\u200b',
  }));
};
