import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveRegion } from '@bot/cache';
import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { handleRegionAutocomplete, onlyAdminRoles } from '@bot/utils';

import { MANAGE_POKEDEX_COMMAND_NAME } from '../pokedex/managePokedex';
import { PROGRESSIONS_COMMAND_NAME } from '../progression/progressions';
import { getRegionMenuEmbeds } from './region.embeds';
import { RegionCommandOptions } from './types';

export type RegionCommand = ISlashCommand<
  AdminMenu<RegionCommandOptions>,
  RegionCommandOptions
>;

const COMMAND_NAME = 'region';
export const REGION_COMMAND_NAME = COMMAND_NAME;

export const RegionCommand: RegionCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage a Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => {
      return option
        .setName('region_id')
        .setDescription('The ID of the region to manage')
        .setRequired(true)
        .setAutocomplete(true);
    }),
  autocomplete: handleRegionAutocomplete,
  createMenu: async (session, options = { region_id: '' }) =>
    new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getRegionButtons(menu, options.region_id))
      .setEmbeds((menu) => getRegionMenuEmbeds(menu, options.region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const getRegionButtons = async (
  menu: AdminMenu<RegionCommandOptions>,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu<RegionCommandOptions>>[]> => {
  const region = await menu.getRegion(regionId);

  const subMenuButtons: { id: string; command: string }[] = [
    { id: 'Pokedex', command: MANAGE_POKEDEX_COMMAND_NAME },
    { id: 'Moves', command: 'moves' },
    { id: 'Progression', command: PROGRESSIONS_COMMAND_NAME },
    { id: 'Locations', command: 'locations' },
    { id: 'Transportation', command: 'transportation' },
    { id: 'Quests', command: 'quests' },
    { id: 'Shops', command: 'shops' },
    { id: 'Mechanics', command: 'mechanics' },
    { id: 'Graphics', command: 'graphics' },
  ];

  return [
    {
      label: region.deployed ? 'Undeploy' : 'Deploy',
      disabled: !region.deployable,
      fixedPosition: 'start',
      style: region.deployed ? ButtonStyle.Danger : ButtonStyle.Success,
      onClick: async (menu) => {
        const region = await menu.getRegion(regionId);
        region.deployed = !region.deployed;
        await saveRegion(region);
        menu.prompt = `Successfully ${
          region.deployed ? 'deployed' : 'undeployed'
        } the ${region.name} Region`;
        await menu.refresh();
      },
    },
    ...subMenuButtons.map(({ id, command }, idx) => ({
      label: `${idx + 1}`,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<RegionCommandOptions>) =>
        MenuWorkflow.openMenu(menu, command, { region_id: regionId }),
      id,
    })),
  ];
};
