import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Region, RegionDTO } from "@shared";

import { router, publicProcedure } from "../init";

export const regionsRouter = router({
  getAll: publicProcedure.query(async () => {
    const regions = await Region.find().exec();
    return regions.map((region) => RegionDTO.convertFromEntity(region));
  }),
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    const region = await Region.findById(input).exec();
    if (!region) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Region with ID ${input} not found`,
      });
    }
    return RegionDTO.convertFromEntity(region);
  }),
});
