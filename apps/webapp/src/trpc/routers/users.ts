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
      // Use upsertUser to create or update the user based on userId
      const user = await User.upsertUser({ userId: input.userId }, input);
      if (!user) {
        throw new Error("Failed to create or update user");
      }
      return UserDTO.convertFromEntity(user);
    }),
});
