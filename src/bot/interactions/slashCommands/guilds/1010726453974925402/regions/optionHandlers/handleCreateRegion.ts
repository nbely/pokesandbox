import { Types } from "mongoose";

import { AdminMenu } from "@bot/classes/adminMenu";
import { createRegion } from "@services/region.service";
import getCreateFirstRegionEmbed from "../embeds/getCreateFirstRegionEmbed";
import getRegionsMenuEmbed from "../embeds/getRegionsMenuEmbed";
import { upsertServer } from "@services/server.service";

import type { IRegion } from "@models/region.model";

const handleCreateRegion = async (menu: AdminMenu): Promise<void> => {
  menu.components = [];
  if (menu.regions.length >= 1) {
    menu.prompt = "Please enter a name for your new Region.";
    menu.embeds = [getRegionsMenuEmbed(menu)];
  } else {
    menu.embeds = [getCreateFirstRegionEmbed(menu)];
  }

  await menu.sendEmbedMessage();

  try {
    const response = await menu.awaitMessageReply(600_000);

    const region: IRegion = await createRegion({
      baseGeneration: 10,
      charactersPerPlayer: 1,
      characterList: [],
      currencyType: "P",
      deployable: false,
      deployed: false,
      graphicSettings: {
        backSpritesEnabled: false,
        frontSpritesEnabled: false,
        iconSpritesEnabled: false,
      },
      locations: [],
      name: response,
      playerList: [],
      pokedex: [],
      progressionTypes: {},
      quests: {
        active: [],
        passive: [],
      },
      shops: [],
      transportationTypes: [],
    });

    menu.server.regions.push(new Types.ObjectId(region._id));
    menu.regions = [...menu.regions, region];
    
    await upsertServer({ serverId: menu.server.serverId }, menu.server);
    menu.prompt = `Successfully created the new region: \`${region.name}\``;
  } catch(error) {
    await menu.handleError(error);
  }
};

export default handleCreateRegion;
