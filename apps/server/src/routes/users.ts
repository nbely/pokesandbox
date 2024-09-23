import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, User, UserDTO } from '@shared';

export const getUsers: AppRouteImplementation<
  typeof contract.getUsers
> = async () => {
  const users = await User.find({});

  return {
    status: 200,
    body: users.map((user) => UserDTO.convertFromEntity(user)),
  };
};
