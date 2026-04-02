import assert from 'node:assert';
import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { getAssertedCachedRegion, saveRegion } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAndProgressionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/core';

import { MILESTONES_COMMAND_NAME } from './milestones';
import { progressionEditMenuEmbeds } from './progression.embeds';
import type {
  EditProgressionFieldConfig,
  ProgressionEditMenuState,
} from './types';
import {
  editProgressionFieldConfigMap,
  handleEditProgressionField,
} from './utils';
import {
  getProgressionEditModal,
  PROGRESSION_EDIT_MODAL_ID,
} from './progressionEdit.modal';

const COMMAND_NAME = 'progression-edit';
export const PROGRESSION_EDIT_COMMAND_NAME = COMMAND_NAME;

const progressionEditCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  progression_key: z.string().min(1),
});

export const ProgressionEditCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAndProgressionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Edit an existing progression definition')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region containing the progression')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('progression_key')
        .setDescription('The progression definition to edit')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  createMenu: async (session, options) => {
    const { region_id, progression_key } = parseCommandOptions(
      progressionEditCommandOptionsSchema,
      options
    );
    const region = await getAssertedCachedRegion(region_id);
    const progression = region.progressionDefinitions.get(progression_key);
    assert(progression, 'Progression definition not found');

    const progressionEditField = session.sessionState.get(
      'progressionEditField'
    ) as string | undefined;
    const config = editProgressionFieldConfigMap.get(
      progressionEditField ?? ''
    );

    const builder = new AdminMenuBuilder<ProgressionEditMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setEmbeds((ctx) =>
        progressionEditMenuEmbeds(
          ctx,
          region_id,
          progression_key,
          progressionEditField
        )
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!progressionEditField) {
      builder.setButtons((ctx) =>
        getEditProgressionDefinitionButtons(ctx, region_id, progression_key)
      );
    } else {
      if (config?.getCustomButtons) {
        builder.setButtons((ctx) =>
          getProgressionEditFieldButtons(
            ctx,
            config,
            region_id,
            progression_key
          )
        );
      }
      if (config?.hasMessageHandler) {
        builder.setMessageHandler(async (ctx, response) => {
          await handleEditProgressionField(
            ctx,
            config,
            region_id,
            progression_key,
            response
          );
        });
      }
    }
    builder.setModal((ctx) =>
      getProgressionEditModal(ctx, region_id, progression_key)
    );

    return builder.build();
  },
};

const getEditProgressionDefinitionButtons = async (
  ctx: AdminMenuContext<ProgressionEditMenuState>,
  regionId: string,
  progressionKey: string
): Promise<ButtonInputConfig<AdminMenuContext<ProgressionEditMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

  const buttons: ButtonInputConfig<
    AdminMenuContext<ProgressionEditMenuState>
  >[] = [
    {
      label: 'Edit',
      style: ButtonStyle.Primary,
      opensModal: PROGRESSION_EDIT_MODAL_ID,
    },
  ];

  if (progression.kind === 'milestone') {
    buttons.push({
      label: 'Milestones',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        await ctx.goTo(MILESTONES_COMMAND_NAME, {
          region_id: regionId,
          progression_key: progressionKey,
        });
      },
    });
  }

  // Add delete button
  buttons.push({
    label: 'Delete',
    style: ButtonStyle.Danger,
    action: async (ctx) => {
      const region = await ctx.admin.getRegion(regionId);
      region.progressionDefinitions.delete(progressionKey);
      await saveRegion(region);
      await ctx.goBack();
    },
  });

  return buttons;
};

const getProgressionEditFieldButtons = async (
  ctx: AdminMenuContext<ProgressionEditMenuState>,
  config: EditProgressionFieldConfig,
  regionId: string,
  progressionKey: string
): Promise<ButtonInputConfig<AdminMenuContext<ProgressionEditMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

  const buttons: ButtonInputConfig<
    AdminMenuContext<ProgressionEditMenuState>
  >[] = [];

  if (config.hasClearButton) {
    buttons.push({
      label: 'Clear',
      style: ButtonStyle.Danger,
      action: async (ctx) => {
        await handleEditProgressionField(
          ctx,
          config,
          regionId,
          progressionKey,
          ''
        );
      },
    });
  }
  if (config.getCustomButtons) {
    const customButtons = await config.getCustomButtons(
      config,
      region,
      progressionKey,
      progression
    );
    buttons.push(...customButtons);
  }

  return buttons;
};
