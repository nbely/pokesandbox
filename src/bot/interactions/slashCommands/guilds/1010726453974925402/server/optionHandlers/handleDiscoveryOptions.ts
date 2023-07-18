import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
} from "discord.js";

import { BotClient } from "@bot/index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import createDiscoveryMenu from "../utils/createDiscoveryMenu";
import getDiscoveryOptionsEmbed from "../embeds/discoveryOptionsEmbed";
import handleMenuUpdate from "../utils/handleMenuUpdate";
import handleSetDescription from "./handleSetDescription";

import { IServerMenu } from "../interfaces/menu";

const handleDiscoveryOptions = async (
  client: BotClient,
  menu: IServerMenu,
): Promise<IServerMenu | undefined> => {
  let isBackSelected = false;

  while (!menu.isCancelled && !isBackSelected) {
    const components: ActionRowBuilder<ButtonBuilder>[] = createDiscoveryMenu(
      menu.server.discovery.enabled,
    );
    if (!menu.server.discovery.enabled && !menu.server.discovery.description) {
      components[0].components[0].setDisabled(true);
    }

    menu.prompt = "Select an option to update your Server Discovery settings.";
    const embeds: EmbedBuilder[] = [
      await getDiscoveryOptionsEmbed(
        menu.interaction as MessageComponentInteraction,
        menu,
      ),
    ];

    menu = await handleMenuUpdate(menu, { components, embeds });

    const filter = (
      componentInteraction: MessageComponentInteraction,
    ): boolean => {
      return componentInteraction.user === menu.interaction?.user;
    };

    try {
      // TODO: Change timeout later
      menu.interaction = await (menu.message as Message).awaitMessageComponent({
        filter,
        time: 60_000,
      });
      const option: string = menu.interaction.customId.split("_")[1];

      switch (option) {
        case "Back":
          menu.prompt = "";
          isBackSelected = true;
          break;
        case "Cancel":
          menu.interaction.update({
            content: "*Command Cancelled*",
            components: [],
            embeds: [],
          });
          menu.isCancelled = true;
          break;
        case "Enable":
        case "Disable":
          menu.prompt = `Successfully ${
            option === "Enable" ? "enabled" : "disabled"
          } Server Discovery`;
          menu.server.discovery.enabled = !menu.server.discovery.enabled;
          break;
        case "Set Description":
          menu = (await handleSetDescription(client, menu)) || menu;
          break;
        default:
          throw new Error("Invalid option selected");
      }
    } catch (e) {
      console.error(e);
      await (menu.message as Message).edit({
        embeds: [
          buildErrorEmbed(
            client,
            menu.interaction?.member as GuildMember,
            "Sorry, the Server Discovery Options menu has timed out. Please try again!",
          ),
        ],
        components: [],
      });
      menu.isCancelled = true;
    }
  }
  return menu;
};

export default handleDiscoveryOptions;
