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
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

import { getRegionMenuEmbeds } from './region.embeds';
import { MANAGE_POKEDEX_COMMAND_NAME } from '../pokedex/managePokedex';

const COMMAND_NAME = 'region';
export const REGION_COMMAND_NAME = COMMAND_NAME;

type RegionCommandOptions = {
  regionId: string;
};

export const RegionCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage a Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options) {
      throw new Error('Options are required');
    }
    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu: AdminMenu) => getRegionButtons(menu, options.regionId))
      .setEmbeds((menu: AdminMenu) => getRegionMenuEmbeds(menu, options.regionId))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
} as ISlashCommand<any, RegionCommandOptions>;

const getRegionButtons = async (
  _menu: AdminMenu,
  regionId: string
): Promise<MenuButtonConfig[]> => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found');
  }

  const subMenuButtons: { id: string; command: string }[] = [
    { id: 'Pokedex', command: MANAGE_POKEDEX_COMMAND_NAME },
    { id: 'Moves', command: 'moves' },
    { id: 'Progression', command: 'progression' },
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
      onClick: async (menu: AdminMenu) => {
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
      onClick: async (menu: any) =>
        MenuWorkflow.openMenu(menu, command, { regionId }),
      id,
    })),
  ];
};
