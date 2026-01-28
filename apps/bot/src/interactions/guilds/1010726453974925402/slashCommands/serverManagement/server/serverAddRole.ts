import {
  InteractionContextType,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenuBuilder,
  SelectMenuConfig,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';

const COMMAND_NAME = 'server-add-role';
export const SERVER_ADD_ROLE_COMMAND_NAME = COMMAND_NAME;

type ServerAddRoleCommandOptions = {
  roleType: string;
};
type ServerAddRoleCommand = ISlashCommand<
  AdminMenu,
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
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options): Promise<AdminMenu> => {
    const { roleType } = options;
    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        getServerMenuEmbeds(
          menu,
          `Please select a role to grant Bot ${roleType} privileges to.`
        )
      )
      .setSelectMenu((menu) => getServerAddRoleSelectMenu(menu, roleType))
      .setTrackedInHistory()
      .build();
  },
};

export const getServerAddRoleSelectMenu = (
  _menu: AdminMenu,
  roleType: string
): SelectMenuConfig<AdminMenu> => {
  return {
    builder: new RoleSelectMenuBuilder()
      .setCustomId(`server-add-${roleType}-role`)
      .setPlaceholder('Select a role to add'),
    onSelect: async (menu: AdminMenu, selectedRoleIds: string[]) => {
      const server = await menu.fetchServer();
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

          await server.save();
          menu.prompt = `Successfully added the ${roleType} roles: ${newRoles.join(
            ', '
          )}`;
        } catch (error) {
          await menu.session.handleError(error);
        }
      } else {
        menu.prompt = `No new ${roleType} roles were selected.`;
      }
      await menu.session.goBack();
    },
  };
};
