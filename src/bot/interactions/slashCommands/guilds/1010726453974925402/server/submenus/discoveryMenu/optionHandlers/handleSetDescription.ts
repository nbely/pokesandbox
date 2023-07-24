import getDiscoveryMenuEmbed from "../embeds/getDiscoveryMenuEmbed";
import { upsertServer } from "@services/server.service";

import { AdminMenu } from "@bot/classes/adminMenu";

const handleSetDescription = async (menu: AdminMenu): Promise<void> => {
  menu.prompt =
    "Please enter a new server description to be displayed on the server discovery page.";
  menu.components = [];
  menu.embeds = [await getDiscoveryMenuEmbed(menu)];

  menu.updateEmbedMessage();

  try {
    const response: string = await menu.awaitMessageReply(600_000);

    menu.server.discovery.description = response;
    await upsertServer({ serverId: menu.server.serverId }, menu.server);
    menu.prompt = `Successfully updated the server description.`;
  } catch (error) {
    await menu.handleError(error);
  }
};

export default handleSetDescription;
