import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

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
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options = { regionId: '' }) =>
    new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getRegionButtons(menu, options.regionId))
      .setEmbeds((menu) => getRegionMenuEmbeds(menu, options.regionId))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const getRegionButtons = async (
  _menu: AdminMenu<RegionCommandOptions>,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu<RegionCommandOptions>>[]> => {
  const region = await Region.findById(regionId);

  if (!region) {
    throw new Error('Region not found');
  }

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
        region.deployed = !region.deployed;
        await region.save();
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
        MenuWorkflow.openMenu(menu, command, { regionId }),
      id,
    })),
  ];
};
