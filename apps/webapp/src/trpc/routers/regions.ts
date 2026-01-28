import { Region, RegionDTO } from "@shared";

import { router, publicProcedure } from "../init";

export const regionsRouter = router({
  getAll: publicProcedure.query(async () => {
    const regions = await Region.find().exec();
    return regions.map((region) => RegionDTO.convertFromEntity(region));
  }),

  // -- Example --
  // update: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       name: z.string().min(3),
  //     })
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     // ctx.session is guaranteed to exist here thanks to protectedProcedure
  //     const updated = await Region.findByIdAndUpdate(
  //       input.id,
  //       { name: input.name, lastUpdatedBy: ctx.session.user.id },
  //       { new: true }
  //     );

  //     return updated;
  //   }),
});
