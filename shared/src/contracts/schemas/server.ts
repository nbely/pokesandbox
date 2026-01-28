import { z } from 'zod';
import { Server, serverEntitySchema } from '../../models/server.model';

export const serverDTOSchema = z.object({
  ...serverEntitySchema.shape,
  _id: z.string(),
  playerList: z.array(z.string()),
  regions: z.array(z.string()),
});

export type ServerDTO = z.infer<typeof serverDTOSchema>;

export const ServerDTO = {
  convertFromEntity(entity: Server): ServerDTO {
    const dto: ServerDTO = {
      ...entity.toJSON(),
      _id: entity._id.toHexString(),
      playerList: entity.playerList.map((id) => id.toHexString()),
      regions: entity.regions.map((id) => id.toHexString()),
    };
    return serverDTOSchema.parse(dto);
  },
};
