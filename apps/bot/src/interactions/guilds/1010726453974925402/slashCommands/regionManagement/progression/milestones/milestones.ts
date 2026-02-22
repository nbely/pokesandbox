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
import { ProgressionDefinition, Region, Server } from '@shared';

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
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focused = interaction.options.getFocused(true);

    if (focused.name === 'region_id') {
      const server = await Server.findServerWithRegions({
        serverId: guildId,
      });
      if (!server) return interaction.respond([]);

      const choices = server.regions
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

      const region = await Region.findById(regionId);
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
        getMilestoneUpsertModal(
          menu,
          region,
          progressionKey,
          progression,
          options
        )
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
