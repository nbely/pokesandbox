import { TRPCError } from "@trpc/server";
import { Types } from "mongoose";
import { z } from "zod";

import {
  User,
  UserDTO,
  userRequestDTOSchema,
  UserWithServersDTO,
} from "@shared";

import { router, publicProcedure, protectedProcedure } from "../init";

export const usersRouter = router({
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
  getAll: publicProcedure.query(async () => {
    const users = await User.find().exec();
    return users.map((user) => UserDTO.convertFromEntity(user));
  }),
  getByUserId: publicProcedure.input(z.string()).query(async ({ input }) => {
    const user: User | null = await User.findOne().byUserId(input).exec();
    if (!user)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User with ID ${input} not found`,
      });
    return UserDTO.convertFromEntity(user);
  }),
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await User.findUserWithServers({ userId }).exec();
    if (!user)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Authorized user not found",
      });
    return UserWithServersDTO.convertFromEntity(user);
  }),
});
