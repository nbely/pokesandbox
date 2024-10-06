import type { Role } from 'discord.js';

import type { AdminMenu } from '@bot/classes';
import { upsertServer } from '@shared/services';

import setUpdateRolesComponents from '../components/setUpdateRolesComponents';
import getServerMenuEmbed from '../embeds/getServerMenuEmbed';
import handleAddRole from './handleAddRole';

const handleUpdateRoles = async (
  menu: AdminMenu,
  roleType: string
): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    menu.prompt =
      menu.prompt || `Add or Remove a Role with Bot ${roleType} privileges.`;
    menu.embeds = [getServerMenuEmbed(menu)];

    const roleIds: string[] =
      roleType === 'Admin' ? menu.server.adminRoleIds : menu.server.modRoleIds;
    const roles: (string | Role)[] | undefined =
      roleType === 'Admin' ? menu.adminRoles : menu.modRoles;
    setUpdateRolesComponents(menu, roleIds, roles);

    await menu.updateEmbedMessage();

    const selection = await menu.awaitButtonMenuInteraction(120_000);
    if (selection === undefined) continue;

    switch (selection) {
      case 'Add Role':
        await handleAddRole(menu, roleIds, roleType);
        break;
      default:
        if (Number.isNaN(+selection)) {
          menu.handleError(new Error('Invalid Option Selected'));
        }

        menu.prompt = `Successfully removed the ${roleType} role: ${
          roles?.[+selection]
        }`;

        if (roleType === 'Admin') {
          menu.adminRoles?.splice(+selection, 1);
          menu.server.adminRoleIds.splice(+selection, 1);
        } else if (roleType === 'Mod') {
          menu.modRoles?.splice(+selection, 1);
          menu.server.modRoleIds.splice(+selection, 1);
        }

        await upsertServer({ serverId: menu.server.serverId }, menu.server);
        break;
    }
  }
};

export default handleUpdateRoles;
