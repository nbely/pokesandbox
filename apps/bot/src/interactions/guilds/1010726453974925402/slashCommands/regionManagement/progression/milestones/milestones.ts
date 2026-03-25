import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAndProgressionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/core';

import { assertProgressionKind } from '../utils';
import { milestonesMenuEmbeds } from './milestone.embeds';
import {
  getMilestoneModals,
  getMilestoneEditModalId,
  MILESTONE_ADD_MODAL_ID,
} from './milestone.modal';
import type { MilestonesMenuState } from './types';

const COMMAND_NAME = 'milestones';
export const MILESTONES_COMMAND_NAME = COMMAND_NAME;

const milestonesCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  progression_key: z.string().min(1),
});

export const MilestonesCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAndProgressionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Create a new milestone for a region progression definition'
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to manage')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('progression_key')
        .setDescription('The progression definition to manage milestones for')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  createMenu: (session, options) => {
    const { region_id, progression_key } = parseCommandOptions(
      milestonesCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilder<MilestonesMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setEmbeds((ctx) => milestonesMenuEmbeds(ctx, region_id, progression_key))
      .setButtons((ctx) =>
        getMilestonesButtons(ctx, region_id, progression_key)
      )
      .setModal((ctx) => getMilestoneModals(ctx, region_id, progression_key))
      .setTrackedInHistory()
      .setCancellable()
      .setReturnable()
      .build();
  },
};

const getMilestonesButtons = async (
  ctx: AdminMenuContext<MilestonesMenuState>,
  regionId: string,
  progressionKey: string
): Promise<ButtonInputConfig<AdminMenuContext<MilestonesMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assertProgressionKind('milestone', progression);

  return [
    {
      label: 'Add',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      opensModal: MILESTONE_ADD_MODAL_ID,
    },
    ...progression.milestones.map((milestone) => ({
      label: milestone.label,
      style: ButtonStyle.Primary,
      opensModal: getMilestoneEditModalId(milestone.key),
    })),
  ];
};
