import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { ServerDTO, ServerWithRegionsDTO } from "@shared/dtos";
import { Server } from "@shared/models";

import { router, publicProcedure } from "../init";

export const serversRouter = router({
  getAll: publicProcedure.query(async () => {
    const servers = await Server.find().exec();
    return servers.map((server) => ServerDTO.convertFromEntity(server));
  }),
  getByIdWithRegions: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const server = await Server.findServerWithRegions({
        serverId: input,
      }).exec();
      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Server with ID ${input} not found`,
        });
      }
      return ServerWithRegionsDTO.convertFromEntity(server);
    }),
});
