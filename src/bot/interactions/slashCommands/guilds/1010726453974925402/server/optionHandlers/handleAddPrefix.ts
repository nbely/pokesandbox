import { AdminMenu } from "@bot/classes/adminMenu";
import getServerOptionsEmbed from "../embeds/getServerMenuEmbed";
import { upsertServer } from "@services/server.service";

const handleAddPrefix = async (menu: AdminMenu): Promise<void> => {
  menu.prompt =
    "Please enter a new prefix to use with this bot on your server.";
  menu.components = [];
  menu.embeds = [getServerOptionsEmbed(menu)];

  await menu.updateEmbedMessage();

  try {
    // TODO: Change timeout late
    const response = await menu.awaitMessageReply(60_000);

    if (!menu.server.prefixes?.includes(response)) {
      menu.server.prefixes = [...menu.server.prefixes, response];
      await upsertServer({ serverId: menu.server.serverId }, menu.server);
      menu.prompt = `Successfully added the prefix: \`${response}\``;
    } else {
      menu.prompt = "Oops! The entered prefix already exists for this server.";
    }
    menu.isReset = true;
  } catch (error) {
    await menu.handleError(error);
  }
};

export default handleAddPrefix;
