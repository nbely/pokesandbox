import { randomUUID } from 'node:crypto';
import {
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitFields,
} from 'discord.js';
import { z } from 'zod';

import { saveRegion } from '@bot/cache';
import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  getModalSelectValue,
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { ButtonInputConfig, ModalConfig } from '@flowcord/v2';
import type { ProgressionDefinition } from '@shared/models';

import { progressionsMenuEmbeds } from './progression.embeds';
import { PROGRESSION_EDIT_COMMAND_NAME } from './progressionEdit';
import type { ProgressionsMenuState } from './types';
import { getOrderedProgressionEntries } from './utils';

const COMMAND_NAME = 'progressions';
export const PROGRESSIONS_COMMAND_NAME = COMMAND_NAME;

const PROGRESSION_CREATE_MODAL_ID = 'progression-create-modal';
const PROGRESSION_NAME_FIELD_ID = 'progression-name';
const PROGRESSION_KIND_FIELD_ID = 'progression-kind';

const progressionsCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
});

export const ProgressionsCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Manage progression definitions for one of your PokéSandbox Regions'
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => {
      return option
        .setName('region_id')
        .setDescription('The ID of the region to manage')
        .setRequired(true)
        .setAutocomplete(true);
    }),
  autocomplete: handleRegionAutocomplete,
  createMenuV2: (session, options) => {
    const { region_id } = parseCommandOptions(
      progressionsCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilderV2<ProgressionsMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setButtons((ctx) => getManageProgressionButtons(ctx, region_id))
      .setEmbeds((ctx) => progressionsMenuEmbeds(ctx, region_id))
      .setModal(() => getProgressionCreateModal(region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getProgressionCreateModal = (
  regionId: string
): ModalConfig<AdminMenuContext<ProgressionsMenuState>> => ({
  id: PROGRESSION_CREATE_MODAL_ID,
  builder: new ModalBuilder()
    .setCustomId(PROGRESSION_CREATE_MODAL_ID)
    .setTitle('Create New Progression')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Progression Name')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId(PROGRESSION_NAME_FIELD_ID)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Badges, Z-Crystals, Battle Points')
            .setRequired(true)
            .setMaxLength(80)
        ),
      new LabelBuilder()
        .setLabel('Progression Type')
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setCustomId(PROGRESSION_KIND_FIELD_ID)
            .setPlaceholder('Select a progression type')
            .addOptions(
              {
                label: 'Milestone',
                value: 'milestone',
                description:
                  'Track discrete achievements (e.g. Badges, Z-Crystals)',
              },
              {
                label: 'Numeric',
                value: 'numeric',
                description: 'Track a numeric value (e.g. Battle Points)',
              },
              {
                label: 'Flag',
                value: 'boolean',
                description: 'Track a simple on/off state',
              }
            )
            .setRequired(true)
        )
    ),
  onSubmit: async (
    ctx: AdminMenuContext<ProgressionsMenuState>,
    fields: ModalSubmitFields
  ) => {
    const name = fields.getTextInputValue(PROGRESSION_NAME_FIELD_ID).trim();
    const kind = getModalSelectValue(
      fields.fields,
      PROGRESSION_KIND_FIELD_ID,
      true
    ) as ProgressionDefinition['kind'];

    const region = await ctx.admin.getRegion(regionId);

    const hasDuplicate = Array.from(
      region.progressionDefinitions.values()
    ).some((def) => def.name === name);
    if (hasDuplicate) {
      ctx.state.set(
        'prompt',
        `A progression named "${name}" already exists. Please choose a different name.`
      );
      return;
    }

    const progressionKey = randomUUID();
    if (kind === 'numeric' || kind === 'boolean') {
      region.progressionDefinitions.set(progressionKey, {
        kind,
        name,
        visibility: 'public',
      });
    } else {
      region.progressionDefinitions.set(progressionKey, {
        kind,
        name,
        visibility: 'public',
        sequential: true,
        milestones: [],
      });
    }

    await saveRegion(region);
  },
});

const getManageProgressionButtons = async (
  ctx: AdminMenuContext<ProgressionsMenuState>,
  regionId: string
): Promise<ButtonInputConfig<AdminMenuContext<ProgressionsMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const orderedProgressions = getOrderedProgressionEntries(
    region.progressionDefinitions
  );

  return [
    {
      label: 'Add',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      opensModal: PROGRESSION_CREATE_MODAL_ID,
    },
    ...orderedProgressions.map(([progressionKey], index) => ({
      id: progressionKey,
      label: `${index + 1}`,
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext<ProgressionsMenuState>) =>
        ctx.goTo(PROGRESSION_EDIT_COMMAND_NAME, {
          region_id: regionId,
          progression_key: progressionKey,
        }),
    })),
  ];
};
