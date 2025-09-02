import { z } from 'zod';
import { User, userEntitySchema } from '../../models/user.model';
import { createRequestDTOSchema } from '../../utils/schema-helpers';

export const userDTOSchema = z.object({
  ...userEntitySchema.shape,
  _id: z.string(),
  servers: z.array(z.string()),
});

export const userRequestDTOSchema = createRequestDTOSchema(userEntitySchema);

export type UserDTO = z.infer<typeof userDTOSchema>;
export type UserRequestDTO = z.infer<typeof userRequestDTOSchema>;

export const UserDTO = {
  convertFromEntity(entity: User): UserDTO {
    const dto: UserDTO = {
      ...entity,
      _id: entity._id.toHexString(),
      servers: entity.servers.map((id) => id.toHexString()),
    };
    return userDTOSchema.parse(dto);
  },
};
