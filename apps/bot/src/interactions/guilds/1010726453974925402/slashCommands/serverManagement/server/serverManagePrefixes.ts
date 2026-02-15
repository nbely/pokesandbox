import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_ADD_PREFIX_COMMAND_NAME } from './serverAddPrefix';

const COMMAND_NAME = 'server-manage-prefixes';
export const SERVER_MANAGE_PREFIXES_COMMAND_NAME = COMMAND_NAME;

export const ServerManagePrefixesCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage command prefixes for your server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getServerManagePrefixesButtons)
      .setEmbeds((menu: AdminMenu) =>
        getServerMenuEmbeds(menu, 'Add or remove a prefix.')
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
} as ISlashCommand<any>;

export const getServerManagePrefixesButtons = async (
  menu: AdminMenu
): Promise<MenuButtonConfig[]> => {
  const server = await menu.fetchServer();

  return [
    {
      label: 'Add Prefix',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu as any, SERVER_ADD_PREFIX_COMMAND_NAME),
    },
    ...server.prefixes.map((prefix, idx) => ({
      label: `Remove ${prefix}`,
      style: ButtonStyle.Danger,
      onClick: (menu: AdminMenu) => handleRemovePrefixButtonClick(menu, idx),
      id: idx.toString(),
    })),
  ];
};

export const handleRemovePrefixButtonClick = async (
  menu: AdminMenu,
  idx: number
) => {
  const server = await menu.fetchServer();

  try {
    const removedPrefix = server.prefixes?.splice(idx, 1)[0];
    await server.save();
    menu.prompt = `Successfully removed the prefix: \`${removedPrefix}\``;
  } catch (error) {
    await menu.session.handleError(error);
  }
  await menu.refresh();
};
