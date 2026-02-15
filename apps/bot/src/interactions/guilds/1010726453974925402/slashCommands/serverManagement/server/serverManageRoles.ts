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
import { SERVER_ADD_ROLE_COMMAND_NAME } from './serverAddRole';

const COMMAND_NAME = 'server-manage-roles';
export const SERVER_MANAGE_ROLES_COMMAND_NAME = COMMAND_NAME;

type ServerManageRolesCommandOptions = {
  roleType: string;
};

export const ServerManageRolesCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage command prefixes for your server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options): Promise<any> => {
    if (!options) {
      throw new Error('Options are required for ServerManageRolesCommand');
    }
    const { roleType } = options;
    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu: AdminMenu) => getServerManageRolesButtons(menu, roleType))
      .setEmbeds((menu: AdminMenu) =>
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
} as ISlashCommand<any, ServerManageRolesCommandOptions>;

export const getServerManageRolesButtons = async (
  menu: AdminMenu,
  roleType: string
): Promise<MenuButtonConfig[]> => {
  const server = await menu.fetchServer();
  const roles = await menu.getRoles(server, roleType);

  return [
    {
      label: 'Add Role',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu: AdminMenu) =>
        MenuWorkflow.openMenu(menu, SERVER_ADD_ROLE_COMMAND_NAME, { roleType }),
    },
    ...roles.map((role, idx) => ({
      label: `Remove [${typeof role === 'string' ? role : role.name}]`,
      style: ButtonStyle.Danger,
      onClick: async () => {
        const server = await menu.fetchServer();

        if (roleType === 'admin') {
          server.adminRoleIds.splice(idx, 1);
        } else if (roleType === 'mod') {
          server.modRoleIds.splice(idx, 1);
        }

        await server.save();
        await menu.refresh();
      },
      id: idx.toString(),
    })),
  ];
};
