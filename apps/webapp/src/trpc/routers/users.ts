import { User, UserDTO } from "@shared";

import { router, publicProcedure } from "../init";

export const usersRouter = router({
  getAll: publicProcedure.query(async () => {
    const users = await User.find().exec();
    return users.map((user) => UserDTO.convertFromEntity(user));
  }),
});
