import { Types } from "mongoose";

import { AdminMenu } from "@bot/classes/adminMenu";
import { createRegion } from "@services/region.service";
import getCreateFirstRegionEmbed from "../../embeds/getCreateFirstRegionEmbed";
import getRegionsMenuEmbed from "../../embeds/getRegionsMenuEmbed";
import { upsertServer } from "@services/server.service";

import type { IRegion } from "@models/region.model";

const handleManageRegionMenu = async (menu: AdminMenu): Promise<void> => {
  menu.prompt =
    "Please enter a name for your new Region.";
  menu.components = [];
  if (menu.regions.length >= 1) {
    menu.embeds = [getRegionsMenuEmbed(menu)];
  } else {
    menu.embeds = [getCreateFirstRegionEmbed(menu)];
  }

  await menu.updateEmbedMessage();

  try {
    const response = await menu.awaitMessageReply(600_000);

    const region: IRegion = await createRegion({
      name: response,
      playerList: [],
    });

    menu.server.regions.push(new Types.ObjectId(region._id));
    menu.regions = [...menu.regions, region];
    menu.prompt = `Successfully created the new region: \`${region.name}\``;

    await upsertServer({ serverId: menu.server.serverId }, menu.server);
  } catch(error) {
    await menu.handleError(error);
  }
};

export default handleManageRegionMenu;
