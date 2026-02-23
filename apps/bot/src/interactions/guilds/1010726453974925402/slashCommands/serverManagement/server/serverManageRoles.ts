import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import {
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_ADD_ROLE_COMMAND_NAME } from './serverAddRole';
import { ServerManageRolesCommandOptions } from './types';

const COMMAND_NAME = 'server-manage-roles';
export const SERVER_MANAGE_ROLES_COMMAND_NAME = COMMAND_NAME;

type ServerManageRolesCommand = ISlashCommand<
  AdminMenu<ServerManageRolesCommandOptions>,
  ServerManageRolesCommandOptions
>;

export const ServerManageRolesCommand: ServerManageRolesCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage command prefixes for your server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options?.roleType) {
      throw new Error('Role type is required to manage server roles.');
    }

    const { roleType } = options;
    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getServerManageRolesButtons(menu, roleType))
      .setEmbeds((menu) =>
        getServerMenuEmbeds(
          menu,
          `Add or Remove a Role with Bot ${roleType} privileges.`
        )
      )
      .setCancellable()
      .setTrackedInHistory()
      .setReturnable()
      .build();
  },
};

export const getServerManageRolesButtons = async (
  menu: AdminMenu<ServerManageRolesCommandOptions>,
  roleType: string
): Promise<MenuButtonConfig<AdminMenu<ServerManageRolesCommandOptions>>[]> => {
  const roles = await menu.getRoles(roleType);

  return [
    {
      label: 'Add Role',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, SERVER_ADD_ROLE_COMMAND_NAME, { roleType }),
    },
    ...roles.map((role, idx) => ({
      label: `Remove [${typeof role === 'string' ? role : role.name}]`,
      style: ButtonStyle.Danger,
      onClick: async () => {
        const server = await menu.getServer();

        if (roleType === 'admin') {
          server.adminRoleIds.splice(idx, 1);
        } else if (roleType === 'mod') {
          server.modRoleIds.splice(idx, 1);
        }

        await saveServer(server);
        await menu.refresh();
      },
      id: idx.toString(),
    })),
  ];
};
