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
import handleAddRole from "./handleAddRole";
import handleMenuUpdate from "../utils/handleMenuUpdate";
import paginateButtons from "@bot/utils/paginateButtons";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleUpdateRoles = async (
  client: BotClient,
  menu: IServerMenu,
  roleType: string,
): Promise<IServerMenu | undefined> => {
  let currentPage = 1;
  let isBackSelected = false;

  while (!menu.isCancelled && !isBackSelected) {
    const fixedStartButtons: ButtonBuilder[] = [ServerOption.create(
      { label: 'Add Role', style: ButtonStyle.Success }
    )];
    const fixedEndButtons: ButtonBuilder[] = [
      ServerOption.create({ label: 'Back', style: ButtonStyle.Secondary }),
      ServerOption.create({ label: 'Cancel', style: ButtonStyle.Secondary }),
    ];
    let removeRoleButtons: ButtonBuilder[] = [];
    const roleIds: string[] | undefined = roleType === "Admin"
      ? menu.server?.adminRoleIds
      : menu.server?.modRoleIds;
    const roles: (string | Role)[] | undefined = roleType === "Admin"
      ? menu.adminRoles
      : menu.modRoles;

    if (roleIds) {
      removeRoleButtons = roleIds.map((roleId, index) => {
        
        const roleName: string = (typeof roles?.[index] !== "string")
          ? (roles?.[index] as Role).name
          : roles?.[index] as string;
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

    menu.prompt = `Add or Remove a Role with Bot ${roleType} privileges.`;
    const embeds: EmbedBuilder[] = [await getServerOptionsEmbed(
      menu.interaction as MessageComponentInteraction,
      menu
    )];
    
    menu = await handleMenuUpdate(menu, { components, embeds });

    const filter = (componentInteraction: MessageComponentInteraction): boolean => {
      return componentInteraction.user === menu.interaction?.user;
    };

    try {
      // TODO: Change timeout later 
      menu.interaction = await (menu.message as Message).awaitMessageComponent({ filter,  time: 60_000 });
      const option: string = menu.interaction.customId.split("_")[1];

      switch (option) {
        case "Back":
          isBackSelected = true;
          break;
        case "Cancel":
          menu.interaction.update({content: '*Command Cancelled*', components: [], embeds: []});
          menu.isCancelled = true;
          break;
        case "Next":
        case "Previous":
          currentPage = option === "Next" ? (currentPage + 1) : (currentPage - 1);
          break;
        case "Add Role":
          menu = await handleAddRole(client, menu, roleType, roleIds) || menu;
          break;
        default:
          if (Number.isNaN(+option)) throw new Error("Invalid Option Selected");

          menu.prompt = `Successfully removed the ${roleType} role: ${roles?.[+option]}`;

          if (roleType === "Admin") {
            menu.adminRoles?.splice(+option, 1);
            menu.server.adminRoleIds?.splice(+option, 1);
          } else if (roleType === "Mod") {
            menu.modRoles?.splice(+option, 1);
            menu.server.modRoleIds?.splice(+option, 1);
          }

          await upsertServer({serverId: menu.server.serverId }, menu.server);
          break;
      }
    }
    catch(e) {
      console.error(e);
      await (menu.message as Message).edit({embeds: [
        buildErrorEmbed(
          client,
          menu.interaction?.member as GuildMember,
          `Sorry, the Update ${roleType} Roles menu has timed out. Please try again!`,
        ),
      ], components: []});
      menu.isCancelled = true;
    }
  }
  return menu;
}

export default handleUpdateRoles;
