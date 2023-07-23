import { Types } from "mongoose";

import { AdminMenu } from "@bot/classes/adminMenu";
import { createRegion } from "@services/region.service";
import { upsertServer } from "@services/server.service";

import type { IRegion } from "@models/region.model";

const handleCreateRegion = async (menu: AdminMenu): Promise<void> => {
  const region: IRegion = await createRegion({
    name: "Default Region",
    playerList: [],
  });

  await upsertServer(
    { serverId: menu.server.serverId },
    {
      ...menu.server,
      regions: [...menu.server.regions, new Types.ObjectId(region._id)],
    },
  );
  menu.regions = [...menu.regions, region];
};

export default handleCreateRegion;
