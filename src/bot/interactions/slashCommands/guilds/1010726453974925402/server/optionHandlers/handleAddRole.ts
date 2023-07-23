import { ActionRowBuilder, Role, RoleSelectMenuBuilder } from "discord.js";

import AddRoleMenu from "@bot/interactions/roleSelectMenus/server/addRole";
import getServerOptionsEmbed from "../embeds/getServerMenuEmbed";
import { upsertServer } from "@services/server.service";

import { AdminMenu } from "@bot/classes/adminMenu";

const handleAddRole = async (
  menu: AdminMenu,
  roleIds: string[],
  roleType: string,
): Promise<void> => {
  menu.prompt = `Please select a role to grant Bot ${roleType} privileges to.`;
  menu.components = [
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      AddRoleMenu.create(),
    ),
  ];
  menu.embeds = [getServerOptionsEmbed(menu)];

  await menu.updateEmbedMessage();

  try {
    // TODO: Change timeout later
    const selectedRoleId = await menu.awaitRoleMenuInteraction(60_000);

    if (!roleIds?.includes(selectedRoleId)) {
      const newRole: string | Role =
        menu.componentInteraction?.guild?.roles.cache.get(selectedRoleId) ??
        (await menu.componentInteraction?.guild?.roles.fetch(selectedRoleId)) ??
        selectedRoleId;

      if (roleType === "Admin") {
        menu.adminRoles = [...menu.adminRoles, newRole];
        menu.server.adminRoleIds = [...roleIds, selectedRoleId];
      } else if (roleType === "Mod") {
        menu.modRoles = [...menu.modRoles, newRole];
        menu.server.modRoleIds = [...roleIds, selectedRoleId];
      }

      await upsertServer({ serverId: menu.server.serverId }, menu.server);
      menu.prompt = `Successfully added the ${roleType} role: ${newRole}`;
    } else {
      menu.prompt = `Oops! The selected role already has Bot ${roleType} privileges.`;
    }
  } catch (error) {
    await menu.handleError(error);
  }
};

export default handleAddRole;
