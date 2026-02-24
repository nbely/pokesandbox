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
import {
  assertOptions,
  handleRegionAndProgressionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';

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
  autocomplete: async (_client, interaction) => {
    await handleRegionAndProgressionAutocomplete(interaction);
  },
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
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id, progression_key } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        milestonesMenuEmbeds(menu, region_id, progression_key)
      )
      .setButtons((menu) =>
        getMilestonesButtons(menu, region_id, progression_key)
      )
      .setModal((menu, options) =>
        getMilestoneUpsertModal(menu, region_id, progression_key, options)
      )
      .setTrackedInHistory()
      .setCancellable()
      .setReturnable()
      .build();
  },
};

export const getMilestonesButtons = async (
  menu: AdminMenu<MilestonesCommandOptions>,
  regionId: string,
  progressionKey: string
): Promise<MenuButtonConfig<AdminMenu<MilestonesCommandOptions>>[]> => {
  const region = await menu.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assertProgressionKind('milestone', progression);

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
