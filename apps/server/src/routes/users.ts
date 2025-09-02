import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, findAllUsers, UserDTO } from '@shared';

export const getUsers: AppRouteImplementation<
  typeof contract.getUsers
> = async () => {
  const users = await findAllUsers();

  return {
    status: 200,
    body: users.map((user) => UserDTO.convertFromEntity(user)),
  };
};
