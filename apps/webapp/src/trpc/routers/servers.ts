import z from "zod";

import { Server, ServerDTO, ServerWithRegionsDTO } from "@shared";
import { TRPCError } from "@trpc/server";

import { router, publicProcedure, protectedProcedure } from "../init";

export const serversRouter = router({
  getAll: publicProcedure.query(async () => {
    const servers = await Server.find().exec();
    return servers.map((server) => ServerDTO.convertFromEntity(server));
  }),
  getByServerIdWithRegions: publicProcedure
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
  getServersForCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const servers = await Server.findServersByUserId(userId);
    return servers.map((server) => ServerDTO.convertFromEntity(server));
  }),
});
