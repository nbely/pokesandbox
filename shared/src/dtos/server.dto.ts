import { z } from 'zod';

import { Region } from '../models/region.model';
import { Server, serverEntitySchema } from '../models/server.model';
import { regionDTOSchema } from './region.dto';
import { convertToDTO } from './utils';

export const serverDTOSchema = z.object({
  ...serverEntitySchema.shape,
  _id: z.string(),
  playerList: z.array(z.string()),
  regions: z.array(z.string()),
});

export type ServerDTO = z.infer<typeof serverDTOSchema>;

export const ServerDTO = {
  convertFromEntity(entity: Server): ServerDTO {
    return serverDTOSchema.parse(convertToDTO(entity));
  },
};

/** Server w/Regions DTO */

export const ServerWithRegionsDTOSchema = serverDTOSchema.extend({
  regions: z.array(regionDTOSchema),
});

export type ServerWithRegionsDTO = z.infer<typeof ServerWithRegionsDTOSchema>;

export const ServerWithRegionsDTO = {
  convertFromEntity(
    entity: Omit<Server, 'regions'> & { regions: Region[] }
  ): ServerWithRegionsDTO {
    return ServerWithRegionsDTOSchema.parse(convertToDTO(entity));
  },
};
