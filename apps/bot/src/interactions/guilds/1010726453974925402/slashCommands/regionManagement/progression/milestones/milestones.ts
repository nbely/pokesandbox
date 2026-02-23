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
import { assertOptions, onlyAdminRoles } from '@bot/utils';

import { assertProgressionKind } from '../utils';
import { milestonesMenuEmbeds } from './milestone.embeds';
import { getMilestoneUpsertModal } from './milestone.modal';
import { MilestonesCommandOptions } from './types';
import { getCachedRegion, getCachedRegions, getCachedServer } from '@bot/cache';

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
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focused = interaction.options.getFocused(true);

    if (focused.name === 'region_id') {
      const server = await getCachedServer(guildId);
      if (!server) return interaction.respond([]);
      const regions = await getCachedRegions(server.regions);

      const choices = regions
        .filter((region) =>
          region.name.toLowerCase().includes(focused.value.toLowerCase())
        )
        .slice(0, 25)
        .map((region) => ({
          name: region.name,
          value: region._id.toString(),
        }));

      await interaction.respond(choices);
    }

    if (focused.name === 'progression_key') {
      const regionId = interaction.options.getString('region_id');
      if (!regionId) return interaction.respond([]);

      const region = await getCachedRegion(regionId);
      if (!region) return interaction.respond([]);

      const choices = Array.from(region.progressionDefinitions.entries())
        .filter(([, def]) =>
          def.name.toLowerCase().includes(focused.value.toLowerCase())
        )
        .slice(0, 25)
        .map(([key, def]) => ({
          name: def.name,
          value: key,
        }));

      await interaction.respond(choices);
    }
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
    const { regionId, progressionKey } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => milestonesMenuEmbeds(menu, regionId, progressionKey))
      .setButtons((menu) =>
        getMilestonesButtons(menu, regionId, progressionKey)
      )
      .setModal((menu, options) =>
        getMilestoneUpsertModal(menu, regionId, progressionKey, options)
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
