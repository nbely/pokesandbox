import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { DISCOVERY_COMMAND_NAME } from '../discovery/discovery';
import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_PREFIXES_COMMAND_NAME } from './serverManagePrefixes';
import { SERVER_MANAGE_ROLES_COMMAND_NAME } from './serverManageRoles';

const COMMAND_NAME = 'server';
export const SERVER_COMMAND_NAME = COMMAND_NAME;

export const ServerCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your PokeSandbox server settings')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getServerButtons)
      .setEmbeds(getServerMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getServerButtons = async (
  menu: AdminMenu
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const { client, session } = menu;
  return [
    {
      label: '1',
      style: ButtonStyle.Primary,
      onClick: async () => {
        const managePrefixesMenu = await client.slashCommands
          .get(SERVER_MANAGE_PREFIXES_COMMAND_NAME)
          .createMenu(session);
        await session.next(managePrefixesMenu);
      },
      id: 'Prefix',
    },
    {
      label: '2',
      style: ButtonStyle.Primary,
      onClick: async () => handleRoleButtonClick(menu, 'admin'),
      id: 'Admin',
    },
    {
      label: '3',
      style: ButtonStyle.Primary,
      onClick: async () => handleRoleButtonClick(menu, 'mod'),
      id: 'Mod',
    },
    {
      label: '4',
      style: ButtonStyle.Primary,
      onClick: async () => {
        const discoveryMenu = await client.slashCommands
          .get(DISCOVERY_COMMAND_NAME)
          .createMenu(session);
        await session.next(discoveryMenu);
      },
      id: 'Discovery',
    },
  ];
};

const handleRoleButtonClick = async (menu: AdminMenu, roleType: string) => {
  const { client, session } = menu;
  const manageRolesMenu = await client.slashCommands
    .get(SERVER_MANAGE_ROLES_COMMAND_NAME)
    .createMenu(session, roleType);
  await session.next(manageRolesMenu, [roleType]);
};
