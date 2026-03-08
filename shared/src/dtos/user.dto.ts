import { z } from 'zod';

import { Server } from '../models/server.model';
import { User, userEntitySchema } from '../models/user.model';
import { serverDTOSchema } from './server.dto';
import { convertToDTO } from './utils';

// Base DTO schema: extends entity schema with servers as string array
export const baseUserDTOSchema = userEntitySchema.extend({
  servers: z.array(z.string()),
});

// For creating users, timestamps are managed by Mongoose and must not be supplied by the client
export const userRequestDTOSchema = baseUserDTOSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const userDTOSchema = baseUserDTOSchema.extend({
  _id: z.string(),
});

export type UserDTO = z.infer<typeof userDTOSchema>;
export type UserRequestDTO = z.infer<typeof userRequestDTOSchema>;

export const UserDTO = {
  convertFromEntity(entity: User): UserDTO {
    return userDTOSchema.parse(convertToDTO(entity));
  },
};

export const UserWithServersDTOSchema = userDTOSchema.extend({
  servers: z.array(serverDTOSchema),
});

export type UserWithServersDTO = z.infer<typeof UserWithServersDTOSchema>;

export const UserWithServersDTO = {
  convertFromEntity(
    entity: Omit<User, 'servers'> & { servers: Server[] }
  ): UserWithServersDTO {
    return UserWithServersDTOSchema.parse(convertToDTO(entity));
  },
};
