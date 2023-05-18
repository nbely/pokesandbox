import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import ServerOption from "@interactions/buttons/server/option";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getServerOptionsEmbed from "../embeds/serverOptionsEmbed";
import handleAddPrefix from "./handleAddPrefix";
import paginateButtons from "@bot/utils/paginateButtons";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleUpdatePrefixes = async (
  client: BotClient,
  menu: IServerMenu
): Promise<IServerMenu | undefined> => {
  let currentPage = 1;
  let isSelectionMade = false;

  while (!menu.isCancelled && !isSelectionMade) {
    const fixedStartButtons: ButtonBuilder[] = [ServerOption.create(
      { label: 'Add Prefix', style: ButtonStyle.Success }
    )];
    const fixedEndButtons: ButtonBuilder[] = [ServerOption.create(
      { label: 'Cancel', style: ButtonStyle.Secondary }
    )];
    let removePrefixButtons: ButtonBuilder[] = [];
    if (menu.server?.prefixes) {
      removePrefixButtons = menu.server.prefixes.map((prefix, index) => {
        return ServerOption.create(
          {
            label: `Remove ${prefix}`,
            style: ButtonStyle.Danger,
            id: index,
          }
        );
      });
    }
    const components: ActionRowBuilder<ButtonBuilder>[] = paginateButtons(
      removePrefixButtons,
      currentPage,
      fixedStartButtons,
      fixedEndButtons
    );

    menu.prompt = "Add or Remove a Prefix.";
    const serverOptionsEmbed: EmbedBuilder = await getServerOptionsEmbed(
      menu.server, 
      menu.interaction as MessageComponentInteraction,
      menu.prompt
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
        case "Add Prefix":
          menu = await handleAddPrefix(client, menu) || menu;
          isSelectionMade = true;
          break;
        default:
          menu.prompt = `Successfully removed the prefix: \`${menu.server.prefixes?.[+option]}\``;
          const updatedPrefixes: string[] = menu.server.prefixes
            ? [...menu.server.prefixes]
            : [];
          updatedPrefixes.splice(+option, 1);
          menu.server = {
            ...menu.server,
            prefixes: updatedPrefixes,
          };
          await upsertServer({serverId: menu.server.serverId }, menu.server);
          isSelectionMade = true;
          break;
      }
    }
    catch(e) {
      console.error(e);
      await (menu.message as Message).edit({embeds: [
        buildErrorEmbed(
          client,
          menu.interaction?.member as GuildMember,
          "Sorry, your prefix menu has timed out. Please use the command again!",
        ),
      ], components: []});
      menu.isCancelled = true;
    }
  }
  return menu;
}

export default handleUpdatePrefixes;
