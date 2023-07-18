import { GuildMember, Message, MessageComponentInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getDiscoveryOptionsEmbed from "../embeds/discoveryOptionsEmbed";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleSetDescription = async (
  client: BotClient,
  menu: IServerMenu,
): Promise<IServerMenu | undefined> => {
  menu.prompt =
    "Please enter a new server description to be displayed on the server discovery page.";
  const serverOptionsEmbed = await getDiscoveryOptionsEmbed(
    menu.interaction as MessageComponentInteraction,
    menu,
  );
  (menu.interaction as MessageComponentInteraction).update({
    components: [],
    embeds: [serverOptionsEmbed],
  });

  const filter = (message: Message): boolean => {
    return message.author.id === menu.interaction?.user.id;
  };
  try {
    // TODO: Change timeout later
    const collectedMessage = await menu.interaction?.channel?.awaitMessages({
      filter,
      errors: ["time"],
      max: 1,
      time: 60_000,
    });

    const response: string | undefined = collectedMessage?.first()?.content;
    if (!response) {
      throw new Error("Invalid response received.");
    }

    menu.server.discovery.description = response;
    await upsertServer({ serverId: menu.server.serverId }, menu.server);
    menu.prompt = `Successfully updated the server description.`;
    menu.isReset = true;
  } catch (e) {
    console.error(e);
    await (menu.message as Message).edit({
      embeds: [
        buildErrorEmbed(
          client,
          menu.interaction?.member as GuildMember,
          "Sorry, the Set Description menu has timed out. Please try again!",
        ),
      ],
      components: [],
    });
    menu.isCancelled = true;
  }
  return menu;
};

export default handleSetDescription;
