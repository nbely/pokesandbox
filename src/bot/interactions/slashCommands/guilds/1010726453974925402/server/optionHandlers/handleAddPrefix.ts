import {
  GuildMember,
  Message,
  MessageComponentInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import getServerOptionsEmbed from "../embeds/serverOptionsEmbed";
import { upsertServer } from "@services/server.service";

import { IServerMenu } from "../interfaces/menu";

const handleAddPrefix = async (
  client: BotClient,
  menu: IServerMenu,
): Promise<IServerMenu | undefined> => {
  menu.prompt = "Please enter a new prefix to use with this bot on your server.";
  const serverOptionsEmbed = await getServerOptionsEmbed(
    menu.server,
    menu.interaction as MessageComponentInteraction,
    menu.prompt
  );
  (menu.interaction as MessageComponentInteraction).update({
    components: [],
    embeds: [serverOptionsEmbed],
  });

  const filter = (message: Message):  boolean => {
    return message.author.id === menu.interaction?.user.id;
  };
  try {
    // TODO: Change timeout later 
    const collectedMessage = await menu.interaction?.channel?.awaitMessages({
      filter,
      errors: ['time'],
      max: 1,
      time: 60_000,
    });
    
    const responsePrefix: string | undefined = collectedMessage?.first()?.content;
    if (!responsePrefix) {
      throw new Error("Invalid response received.");
    }

    const updatedPrefixes: string[] = menu.server.prefixes
      ? [...menu.server.prefixes, responsePrefix]
      : [responsePrefix];
    
    menu.server = {
      ...menu.server,
      prefixes: updatedPrefixes,
    };
    await upsertServer({serverId: menu.server.serverId }, menu.server);
    menu.prompt = `Successfully added the prefix: \`${responsePrefix}\``;
    menu.isReset = true;
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
  return menu;
}

export default handleAddPrefix;
