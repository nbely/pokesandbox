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

export const createUser: AppRouteImplementation<
  typeof contract.createUser
> = async ({ body }) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ userId: body.userId });
    if (existingUser) {
      return {
        status: 400,
        body: { message: 'User already exists' },
      };
    }

    // Create new user
    const newUser = new User(body);
    const savedUser = await newUser.save();

    return {
      status: 201,
      body: UserDTO.convertFromEntity(savedUser),
    };
  } catch (error) {
    return {
      status: 400,
      body: { message: 'Failed to create user' },
    };
  }
};
