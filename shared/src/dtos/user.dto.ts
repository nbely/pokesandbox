import { z } from 'zod';

import { Server } from '../models/server.model';
import { User, userEntitySchema } from '../models/user.model';
import { serverDTOSchema } from './server.dto';
import { convertToDTO } from './utils';

// For creating users, we use the entity schema directly since it already excludes _id
export const userRequestDTOSchema = z.object({
  ...userEntitySchema.shape,
  servers: z.array(z.string()),
});

export const userDTOSchema = z.object({
  ...userRequestDTOSchema.shape,
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
