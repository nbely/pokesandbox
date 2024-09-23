import { HydratedDocument, Model, Query, Schema, Types, model } from 'mongoose';
import { z } from 'zod';

export const regionEntitySchema = z.object({
  _id: z.instanceof(Types.ObjectId),
  baseGeneration: z.number(),
  charactersPerPlayer: z.number(),
  characterList: z.array(z.instanceof(Types.ObjectId)),
  currencyType: z.string(),
  deployable: z.boolean(),
  deployed: z.boolean(),
  graphicSettings: z.object({
    backSpritesEnabled: z.boolean().optional(),
    frontSpritesEnabled: z.boolean().optional(),
    iconSpritesEnabled: z.boolean().optional(),
    mapImageLink: z.string().optional(),
  }),
  locations: z.array(z.instanceof(Types.ObjectId)),
  name: z.string(),
  playerList: z.array(z.instanceof(Types.ObjectId)),
  pokedex: z.array(
    z
      .object({
        id: z.instanceof(Types.ObjectId),
        name: z.string(),
      })
      .nullable(),
  ),
  progressionTypes: z.record(z.union([z.array(z.string()), z.number()])),
  quests: z.object({
    active: z.array(z.instanceof(Types.ObjectId)),
    passive: z.array(z.instanceof(Types.ObjectId)),
    maxPassiveQuests: z.number().optional(),
  }),
  shops: z.array(z.instanceof(Types.ObjectId)),
  transportationTypes: z.array(z.string()),
});

export type RegionEntity = z.infer<typeof regionEntitySchema>;

export type Region = HydratedDocument<RegionEntity>;

type RegionModelType = Model<RegionEntity, RegionQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type RegionModelQuery = Query<
  any,
  HydratedDocument<RegionEntity>,
  RegionQueryHelpers
> &
  RegionQueryHelpers;

export interface RegionQueryHelpers {
  byRegionId(this: RegionModelQuery, serverId: string): RegionModelQuery;
}

export const RegionSchema: Schema = new Schema({
  baseGeneration: { type: Number, required: true },
  charactersPerPlayer: { type: Number, required: true },
  characterList: { type: [Schema.Types.ObjectId], ref: 'Character' },
  currencyType: { type: String, required: true },
  deployable: { type: Boolean, required: true },
  deployed: { type: Boolean, required: true },
  graphicSettings: {
    type: {
      backSpritesEnabled: { type: String, required: false },
      frontSpritesEnabled: { type: Boolean, required: false },
      iconSpritesEnabled: { type: String, required: false },
      mapImageLink: { type: String, required: false },
    },
    required: true,
  },
  locations: { type: [Schema.Types.ObjectId], ref: 'Location', required: true },
  name: { type: String, required: true },
  playerList: { type: [Schema.Types.ObjectId], ref: 'User', required: true },
  pokedex: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
        name: { type: String, required: false },
      },
    ],
    required: true,
  },
  progressionTypes: {
    type: Map,
    of: Schema.Types.Mixed,
    required: true,
  },
  quests: {
    type: {
      active: { type: [Schema.Types.ObjectId], ref: 'Quest', required: true },
      passive: { type: [Schema.Types.ObjectId], ref: 'Quest', required: true },
      maxPassiveQuests: { type: Number, required: false },
    },
    required: true,
  },
  shops: { type: [Schema.Types.ObjectId], ref: 'Shop', required: true },
  transportationTypes: { type: [String], required: true },
});

export const Region = model<RegionEntity, RegionModelType>(
  'Region',
  RegionSchema,
  'regions',
);
