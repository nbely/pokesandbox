import { Types } from "mongoose";

import { User, UserDTO, userRequestDTOSchema } from "@shared";

import { router, publicProcedure } from "../init";

export const usersRouter = router({
  getAll: publicProcedure.query(async () => {
    const users = await User.find().exec();
    return users.map((user) => UserDTO.convertFromEntity(user));
  }),
  create: publicProcedure
    .input(userRequestDTOSchema)
    .mutation(async ({ input }) => {
      // Convert server IDs from strings to ObjectIds
      const userData = {
        ...input,
        servers: input.servers.map((id) => new Types.ObjectId(id)),
      };
      
      // Use upsertUser to create or update the user based on userId
      const user = await User.upsertUser({ userId: input.userId }, userData);
      if (!user) {
        throw new Error("Failed to create or update user");
      }
      return UserDTO.convertFromEntity(user);
    }),
});
