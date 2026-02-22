import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenuBuilder,
  MenuButtonConfig,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { ProgressionDefinition, Region } from '@shared';

import { assertProgressionKind } from '../utils';
import { milestonesMenuEmbeds } from './milestone.embeds';
import { getMilestoneUpsertModal } from './milestone.modal';
import { MilestonesCommandOptions } from './types';

const COMMAND_NAME = 'milestones';
export const MILESTONES_COMMAND_NAME = COMMAND_NAME;

type MilestonesCommand = ISlashCommand<
  AdminMenu<MilestonesCommandOptions>,
  MilestonesCommandOptions
>;

export const MilestonesCommand: MilestonesCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Create a new milestone for a region progression definition'
    )
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options?.regionId || !options?.progressionKey) {
      throw new Error(
        'Region and Progression are required to create a milestone.'
      );
    }

    const { regionId, progressionKey } = options;
    const region = await Region.findById(regionId);
    if (!region) {
      throw new Error('Region not found.');
    }

    const progression = region.progressionDefinitions.get(progressionKey);
    if (!progression) {
      throw new Error('Progression definition not found.');
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => milestonesMenuEmbeds(menu, progression))
      .setButtons((menu) => getMilestonesButtons(menu, progression))
      .setModal((menu, options) =>
        getMilestoneUpsertModal(menu, region, progression, options)
      )
      .setTrackedInHistory()
      .setCancellable()
      .setReturnable()
      .build();
  },
};

export const getMilestonesButtons = async (
  _menu: AdminMenu<MilestonesCommandOptions>,
  progression: ProgressionDefinition
): Promise<MenuButtonConfig<AdminMenu<MilestonesCommandOptions>>[]> => {
  assertProgressionKind(progression, 'milestone');

  return [
    {
      label: 'Add Milestone',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu: AdminMenu<MilestonesCommandOptions>) => {
        await menu.openModal();
      },
    },
    ...progression.milestones.map((milestone) => ({
      label: milestone.label,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<MilestonesCommandOptions>) => {
        await menu.openModal({ milestoneKey: milestone.key });
      },
    })),
  ];
};
