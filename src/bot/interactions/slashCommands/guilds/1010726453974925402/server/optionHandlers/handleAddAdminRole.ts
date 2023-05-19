import {
  ActionRowBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Role,
  RoleSelectMenuBuilder
} from "discord.js";

import AddAdminRoleMenu from "@interactions/roleSelectMenus/server/addAdminRole";
import { BotClient } from "@bot/index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getServerOptionsEmbed from "../embeds/serverOptionsEmbed";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleAddAdminRole = async (
  client: BotClient,
  menu: IServerMenu,
): Promise<IServerMenu | undefined> => {
  menu.prompt = "Please select a role to grant Bot Admin privileges to.";
  const serverOptionsEmbed = await getServerOptionsEmbed(
    menu.interaction as MessageComponentInteraction,
    menu
  );
  const components = [new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(AddAdminRoleMenu.create())
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

    if (!menu.server.adminRoleIds?.includes(selectedRoleId)) {
      const newAdminRole: string | Role = 
        menu.interaction.guild?.roles.cache.get(selectedRoleId)
        || await menu.interaction.guild?.roles.fetch(selectedRoleId)
        || selectedRoleId;

      menu.adminRoles = menu.adminRoles
        ? [...menu.adminRoles, newAdminRole]
        : [newAdminRole];
      const updatedAdminRoleIds: string[] = menu.server.adminRoleIds
        ? [...menu.server.adminRoleIds, selectedRoleId]
        : [selectedRoleId];
      
      menu.server = {
        ...menu.server,
        adminRoleIds: updatedAdminRoleIds,
      };
      await upsertServer({serverId: menu.server.serverId }, menu.server);
      menu.prompt = `Successfully added the admin role: ${newAdminRole}`;
    } else {
      menu.prompt = "Oops! The selected role already has Bot Admin privileges.";
    }
    
  }
  catch(e) {
    console.error(e);
    await (menu.message as Message).edit({embeds: [
      buildErrorEmbed(
        client,
        menu.interaction?.member as GuildMember,
        "Sorry, the Add Admin Role menu has timed out. Please try again!",
      ),
    ], components: []});
    menu.isCancelled = true;
  }
  return menu;
}

export default handleAddAdminRole;
