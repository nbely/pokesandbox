import {
  InteractionContextType,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import {
  AdminMenuBuilder,
  MenuWorkflow,
  SelectMenuConfig,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { assertOptions, onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_ROLES_COMMAND_NAME } from './serverManageRoles';

const COMMAND_NAME = 'server-add-role';
export const SERVER_ADD_ROLE_COMMAND_NAME = COMMAND_NAME;

type ServerAddRoleCommandOptions = {
  role_type: string;
};
type ServerAddRoleCommand = ISlashCommand<
  AdminMenu<ServerAddRoleCommandOptions>,
  ServerAddRoleCommandOptions
>;

export const ServerAddRoleCommand: ServerAddRoleCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new admin or mod role to your server')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('role_type')
        .setDescription('The type of role to add')
        .setRequired(true)
        .addChoices(
          { name: 'Admin', value: 'admin' },
          { name: 'Mod', value: 'mod' }
        )
    ),
  createMenu: async (session, options) => {
    assertOptions(options);
    const { role_type } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        getServerMenuEmbeds(
          menu,
          `Please select a role to grant Bot ${role_type} privileges to.`
        )
      )
      .setSelectMenu(async (menu) =>
        getServerAddRoleSelectMenu(menu, role_type)
      )
      .build();
  },
};

export const getServerAddRoleSelectMenu = async (
  _menu: AdminMenu<ServerAddRoleCommandOptions>,
  roleType: string
): Promise<SelectMenuConfig<AdminMenu<ServerAddRoleCommandOptions>>> => {
  return {
    builder: new RoleSelectMenuBuilder()
      .setCustomId(`server-add-${roleType}-role`)
      .setPlaceholder('Select a role to add'),
    onSelect: async (
      menu: AdminMenu<ServerAddRoleCommandOptions>,
      selectedRoleIds: string[]
    ) => {
      const server = await menu.getServer();
      const roleIds =
        roleType === 'admin' ? server.adminRoleIds : server.modRoleIds;
      const newRoleIds = selectedRoleIds.filter(
        (roleId) => !roleIds.includes(roleId)
      );

      if (newRoleIds.length > 0) {
        try {
          const newRoles = await Promise.all(
            newRoleIds.map((roleId) => menu.getGuildRole(roleId))
          );

          if (roleType === 'admin') {
            server.adminRoleIds = roleIds.concat(newRoleIds);
          } else if (roleType === 'mod') {
            server.modRoleIds = roleIds.concat(newRoleIds);
          }

          await saveServer(server);
          menu.prompt = `Successfully added the ${roleType} roles: ${newRoles.join(
            ', '
          )}`;
        } catch (error) {
          await menu.session.handleError(error);
        }
      } else {
        menu.prompt = `No new ${roleType} roles were selected.`;
      }
      await menu.session.goBack(() =>
        MenuWorkflow.openMenu(menu, SERVER_MANAGE_ROLES_COMMAND_NAME, {
          role_type: roleType,
        })
      );
    },
  };
};
