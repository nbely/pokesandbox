import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Role
} from "discord.js";

import { BotClient } from "@bot/index";
import ServerOption from "@interactions/buttons/server/option";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getServerOptionsEmbed from "../embeds/serverOptionsEmbed";
import handleAddAdminRole from "./handleAddAdminRole";
import paginateButtons from "@bot/utils/paginateButtons";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleUpdateAdminRoles = async (
  client: BotClient,
  menu: IServerMenu
): Promise<IServerMenu | undefined> => {
  let currentPage = 1;
  let isSelectionMade = false;

  while (!menu.isCancelled && !isSelectionMade) {
    const fixedStartButtons: ButtonBuilder[] = [ServerOption.create(
      { label: 'Add Role', style: ButtonStyle.Success }
    )];
    const fixedEndButtons: ButtonBuilder[] = [ServerOption.create(
      { label: 'Cancel', style: ButtonStyle.Secondary }
    )];
    let removeRoleButtons: ButtonBuilder[] = [];
    if (menu.server?.adminRoleIds) {
      removeRoleButtons = menu.server.adminRoleIds.map((roleId, index) => {
        const roleName: string = (typeof menu.adminRoles?.[index] !== "string")
          ? (menu.adminRoles?.[index] as Role).name
          : ""
        return ServerOption.create(
          {
            label: `Remove [${roleName}]`,
            style: ButtonStyle.Danger,
            id: index,
          }
        );
      });
    }
    const components: ActionRowBuilder<ButtonBuilder>[] = paginateButtons(
      removeRoleButtons,
      currentPage,
      fixedStartButtons,
      fixedEndButtons,
    );

    menu.prompt = "Add or Remove a Role with Bot Admin privileges.";
    const serverOptionsEmbed: EmbedBuilder = await getServerOptionsEmbed(
      menu.interaction as MessageComponentInteraction,
      menu
    );
    (menu.interaction as MessageComponentInteraction).update({
      components,
      embeds: [serverOptionsEmbed],
    })

    const filter = (componentInteraction: MessageComponentInteraction): boolean => {
      return componentInteraction.user === menu.interaction?.user
    };

    try {
      // TODO: Change timeout later 
      menu.interaction = await (menu.message as Message).awaitMessageComponent({ filter,  time: 60_000 });
      const option: string = menu.interaction.customId.split("_")[1];

      switch (option) {
        case "Cancel":
          menu.interaction.update({content: '*Command Cancelled*', components: [], embeds: []});
          menu.isCancelled = true;
          break;
        case "Next":
        case "Previous":
          currentPage = option === "Next" ? (currentPage + 1) : (currentPage - 1);
          break;
        case "Add Role":
          menu = await handleAddAdminRole(client, menu) || menu;
          isSelectionMade = true;
          break;
        default:
          menu.prompt = `Successfully removed the admin role: ${menu.adminRoles?.[+option]}`;
          let updatedMenuAdminRoles: (string | Role)[] | undefined,
              updatedServerAdminRoleIds: string[];
          if (menu.server.adminRoleIds && menu.adminRoles) {
            updatedMenuAdminRoles = [...menu.adminRoles];
            updatedServerAdminRoleIds= [...menu.server.adminRoleIds];
            updatedMenuAdminRoles.splice(+option, 1);
            updatedServerAdminRoleIds.splice(+option, 1);

            menu.adminRoles = updatedMenuAdminRoles;
            menu.server = {
              ...menu.server,
              adminRoleIds: updatedServerAdminRoleIds,
            };
            await upsertServer({serverId: menu.server.serverId }, menu.server);
            isSelectionMade = true;
          }
          break;
      }
    }
    catch(e) {
      console.error(e);
      await (menu.message as Message).edit({embeds: [
        buildErrorEmbed(
          client,
          menu.interaction?.member as GuildMember,
          "Sorry, the Update Admin Roles menu has timed out. Please try again!",
        ),
      ], components: []});
      menu.isCancelled = true;
    }
  }
  return menu;
}

export default handleUpdateAdminRoles;
