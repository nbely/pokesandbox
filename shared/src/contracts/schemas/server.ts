import { z } from 'zod';
import { Server, serverEntitySchema } from '../../models/server.model';
import { RegionDTO, regionDTOSchema } from './region';
import { Region } from '@shared/models';

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

export const ServerWithRegionsDTOSchema = serverDTOSchema.extend({
  regions: z.array(regionDTOSchema),
});

export type ServerWithRegionsDTO = z.infer<typeof ServerWithRegionsDTOSchema>;

export const ServerWithRegionsDTO = {
  convertFromEntity(
    entity: Omit<Server, 'regions'> & { regions: Region[] }
  ): ServerWithRegionsDTO {
    const dto: ServerWithRegionsDTO = {
      ...entity.toJSON(),
      _id: entity._id.toHexString(),
      playerList: entity.playerList.map((id) => id.toHexString()),
      regions: entity.regions.map((region) =>
        RegionDTO.convertFromEntity(region)
      ),
    };
    return ServerWithRegionsDTOSchema.parse(dto);
  },
};
