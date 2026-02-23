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

import { REGION_COMMAND_NAME } from '../region/region';
import { REGION_CREATE_COMMAND_NAME } from './regionCreate';
import { getRegionsMenuEmbeds } from './regions.embeds';

const COMMAND_NAME = 'regions';
export const REGIONS_COMMAND_NAME = COMMAND_NAME;

export const RegionsCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage Regions for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getRegionsButtons)
      .setEmbeds(getRegionsMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getRegionsButtons = async (
  menu: AdminMenu
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const regions = await menu.getRegions();

  return [
    {
      label: 'Create Region',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, REGION_CREATE_COMMAND_NAME),
    },
    ...regions.map((region) => ({
      label: region.name,
      id: region._id.toString(),
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu) =>
        MenuWorkflow.openMenu(menu, REGION_COMMAND_NAME, {
          region_id: region._id.toString(),
        }),
    })),
  ];
};
