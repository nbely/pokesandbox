import { z } from 'zod';
import { Region, regionEntitySchema } from '../../models/region.model';

export const regionDTOSchema = z.object({
  ...regionEntitySchema.shape,
  _id: z.string(),
  characterList: z.array(z.string()),
  locations: z.array(z.string()),
  playerList: z.array(z.string()),
  pokedex: z.array(
    z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
  ),
  quests: z.object({
    active: z.array(z.string()),
    passive: z.array(z.string()),
    maxPassiveQuests: z.number().optional(),
  }),
  shops: z.array(z.string()),
});

export type RegionDTO = z.infer<typeof regionDTOSchema>;

export const RegionDTO = {
  convertFromEntity(entity: Region): RegionDTO {
    const dto: RegionDTO = {
      ...entity,
      _id: entity._id.toHexString(),
      characterList: entity.characterList.map((c) => c.toHexString()),
      locations: entity.locations.map((l) => l.toHexString()),
      playerList: entity.playerList.map((p) => p.toHexString()),
      pokedex: entity.pokedex.map((p) =>
        p
          ? {
              id: p.id.toHexString(),
              name: p.name,
            }
          : null,
      ),
      quests: {
        active: entity.quests.active.map((q) => q.toHexString()),
        passive: entity.quests.passive.map((q) => q.toHexString()),
        maxPassiveQuests: entity.quests.maxPassiveQuests,
      },
      shops: entity.shops.map((s) => s.toHexString()),
    };
    return regionDTOSchema.parse(dto);
  },
};
