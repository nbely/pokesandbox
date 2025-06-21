import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getRegionsMenuEmbeds } from './regions.embeds';
import { REGION_CREATE_COMMAND_NAME } from './regionCreate';

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
  const { client, session } = menu;
  const { regions } = await menu.fetchServerAndRegions();

  return [
    {
      label: 'Create Region',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      onClick: async () => {
        const createRegionMenu = await client.slashCommands
          .get(REGION_CREATE_COMMAND_NAME)
          .createMenu(session);
        await session.next(createRegionMenu);
      },
    },
    ...regions.map((region) => ({
      label: region.name,
      style: ButtonStyle.Primary,
      onClick: async () => {
        const regionMenu = await client.slashCommands
          .get('region')
          .createMenu(session);
        await session.next(regionMenu);
      },
      id: region._id.toString(),
    })),
  ];
};
