import {
  ActionRowBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Role,
  RoleSelectMenuBuilder
} from "discord.js";

import AddRoleMenu from "@bot/interactions/roleSelectMenus/server/addRole";
import { BotClient } from "@bot/index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getServerOptionsEmbed from "../embeds/serverOptionsEmbed";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleAddRole = async (
  client: BotClient,
  menu: IServerMenu,
  roleType: string,
  roleIds: string[] | undefined,
): Promise<IServerMenu | undefined> => {
  menu.prompt = `Please select a role to grant Bot ${roleType} privileges to.`;
  const serverOptionsEmbed = await getServerOptionsEmbed(
    menu.interaction as MessageComponentInteraction,
    menu
  );
  const components = [new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(AddRoleMenu.create())
  ];
  (menu.interaction as MessageComponentInteraction).update({
    components,
    embeds: [serverOptionsEmbed],
  });

  const filter = (componentInteraction: MessageComponentInteraction): boolean => {
    return componentInteraction.user === menu.interaction?.user;
  };
  try {
    // TODO: Change timeout later 
    menu.interaction = await (menu.message as Message).awaitMessageComponent({ filter,  time: 60_000 });
    if (!menu.interaction.isRoleSelectMenu()) return;

    const selectedRoleId: string = menu.interaction.values[0];

    if (!roleIds?.includes(selectedRoleId)) {
      const newRole: string | Role = 
        menu.interaction.guild?.roles.cache.get(selectedRoleId)
        || await menu.interaction.guild?.roles.fetch(selectedRoleId)
        || selectedRoleId;

      if (roleType === "Admin") {
        menu.adminRoles = menu.adminRoles
          ? [...menu.adminRoles, newRole]
          : [newRole];
        menu.server.adminRoleIds = roleIds
          ? [...roleIds, selectedRoleId]
          : [selectedRoleId];
      } else if (roleType === "Mod") {
        menu.modRoles = menu.modRoles
          ? [...menu.modRoles, newRole]
          : [newRole];
        menu.server.modRoleIds = roleIds
          ? [...roleIds, selectedRoleId]
          : [selectedRoleId];
      }
      
      await upsertServer({serverId: menu.server.serverId }, menu.server);
      menu.prompt = `Successfully added the ${roleType} role: ${newRole}`;
    } else {
      menu.prompt = `Oops! The selected role already has Bot ${roleType} privileges.`;
    }
    
  }
  catch(e) {
    console.error(e);
    await (menu.message as Message).edit({embeds: [
      buildErrorEmbed(
        client,
        menu.interaction?.member as GuildMember,
        `Sorry, the Add ${roleType} Role menu has timed out. Please try again!`,
      ),
    ], components: []});
    menu.isCancelled = true;
  }
  return menu;
}

export default handleAddRole;
