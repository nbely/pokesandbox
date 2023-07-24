import { Role } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import getServerMenuEmbed from "../embeds/getServerMenuEmbed";
import getUpdateRolesComponents from "../components/getUpdateRolesComponents";
import handleAddRole from "./handleAddRole";
import { upsertServer } from "@services/server.service";

const handleUpdateRoles = async (
  menu: AdminMenu,
  roleType: string,
): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    menu.prompt =
      menu.prompt || `Add or Remove a Role with Bot ${roleType} privileges.`;
    menu.embeds = [getServerMenuEmbed(menu)];

    const roleIds: string[] =
      roleType === "Admin" ? menu.server.adminRoleIds : menu.server.modRoleIds;
    const roles: (string | Role)[] | undefined =
      roleType === "Admin" ? menu.adminRoles : menu.modRoles;
    menu.components = getUpdateRolesComponents(menu, roleIds, roles);

    await menu.handleMenuReset();

    try {
      const option = await menu.awaitButtonMenuInteraction(120_000);

      switch (option) {
        case "Add Role":
          await handleAddRole(menu, roleIds, roleType);
          break;
        case "Next":
          menu.currentPage++;
          break;
        case "Previous":
          menu.currentPage--;
          break;
        case "Back":
          menu.back();
          break;
        case "Cancel":
          await menu.cancel();
          break;
        default:
          if (!option || Number.isNaN(+option))
            throw new Error("Invalid Option Selected");

          menu.prompt = `Successfully removed the ${roleType} role: ${roles?.[
            +option
          ]}`;

          if (roleType === "Admin") {
            menu.adminRoles?.splice(+option, 1);
            menu.server.adminRoleIds.splice(+option, 1);
          } else if (roleType === "Mod") {
            menu.modRoles?.splice(+option, 1);
            menu.server.modRoleIds.splice(+option, 1);
          }

          await upsertServer({ serverId: menu.server.serverId }, menu.server);
          break;
      }
    } catch (error) {
      await menu.handleError(error);
    }
  }
};

export default handleUpdateRoles;
