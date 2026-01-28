import { z } from 'zod';
import { User, userEntitySchema } from '../../models/user.model';

export const userDTOSchema = z.object({
  ...userEntitySchema.shape,
  _id: z.string(),
  servers: z.array(z.string()),
});

// For creating users, we use the entity schema directly since it already excludes _id
export const userRequestDTOSchema = z.object({
  ...userEntitySchema.shape,
  servers: z.array(z.string()), // Convert ObjectId to string for API
});

export type UserDTO = z.infer<typeof userDTOSchema>;
export type UserRequestDTO = z.infer<typeof userRequestDTOSchema>;

export const UserDTO = {
  convertFromEntity(entity: User): UserDTO {
    const dto: UserDTO = {
      ...entity.toJSON(),
      _id: entity._id.toHexString(),
      servers: entity.servers.map((id) => id.toHexString()),
    };
    return userDTOSchema.parse(dto);
  },
};
