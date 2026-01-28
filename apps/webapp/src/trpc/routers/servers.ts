import { Server, ServerDTO } from "@shared";

import { router, publicProcedure } from "../init";

export const serversRouter = router({
  getAll: publicProcedure.query(async () => {
    const servers = await Server.find().exec();
    return servers.map((server) => ServerDTO.convertFromEntity(server));
  }),
});
