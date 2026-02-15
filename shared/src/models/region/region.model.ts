import {
  type HydratedDocument,
  type Model,
  model,
  models,
  type Query,
  type QueryFilter,
  type QueryWithHelpers,
  Schema,
  Types,
} from 'mongoose';
import { z } from 'zod';
import {
  progressionDefinitionDbSchema,
  progressionDefinitionSchema,
} from './progressionDefinition';

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
      .nullable()
  ),
  progressionTypes: z.record(progressionDefinitionSchema),
  quests: z.object({
    active: z.array(z.instanceof(Types.ObjectId)),
    passive: z.array(z.instanceof(Types.ObjectId)),
    maxPassiveQuests: z.number().optional(),
  }),
  shops: z.array(z.instanceof(Types.ObjectId)),
  transportationTypes: z.array(z.string()),
});

export type IRegion = z.infer<typeof regionEntitySchema>;
export type Region = HydratedDocument<IRegion>;

// Define interface for query helpers
interface IRegionQueryHelpers {
  byIds(ids: string[]): QueryWithHelpers<any, Region, IRegionQueryHelpers>;
}

interface IRegionModel extends Model<IRegion, IRegionQueryHelpers> {
  createRegion(region: IRegion): Promise<Region>;
  upsertRegion(
    filter: QueryFilter<IRegion>,
    update: Partial<IRegion>
  ): Query<Region | null, IRegion>;
}

export const regionSchema = new Schema<
  IRegion,
  IRegionModel,
  Record<string, never>,
  IRegionQueryHelpers
>(
  {
    baseGeneration: { type: Number, required: true },
    charactersPerPlayer: { type: Number, required: true },
    characterList: { type: [Schema.Types.ObjectId], ref: 'Character' },
    currencyType: { type: String, required: true },
    deployable: { type: Boolean, required: true },
    deployed: { type: Boolean, required: true },
    graphicSettings: {
      type: {
        backSpritesEnabled: Boolean,
        frontSpritesEnabled: Boolean,
        iconSpritesEnabled: Boolean,
        mapImageLink: String,
      },
      required: true,
    },
    locations: {
      type: [Schema.Types.ObjectId],
      ref: 'Location',
      required: true,
    },
    name: { type: String, required: true },
    playerList: { type: [Schema.Types.ObjectId], ref: 'User', required: true },
    pokedex: {
      type: [
        {
          id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
          name: String,
        },
      ],
      required: true,
    },
    progressionTypes: {
      type: Map,
      of: progressionDefinitionDbSchema,
      required: true,
    },
    quests: {
      type: {
        active: { type: [Schema.Types.ObjectId], ref: 'Quest', required: true },
        passive: {
          type: [Schema.Types.ObjectId],
          ref: 'Quest',
          required: true,
        },
        maxPassiveQuests: { type: Number, required: false },
      },
      required: true,
    },
    shops: { type: [Schema.Types.ObjectId], ref: 'Shop', required: true },
    transportationTypes: { type: [String], required: true },
  },
  {
    query: {
      byIds(
        this: QueryWithHelpers<any, Region, IRegionQueryHelpers>,
        ids: string[]
      ) {
        return this.where({ _id: { $in: ids } });
      },
    },
    statics: {
      createRegion(region: IRegion) {
        const newRegion = new this(region);
        return newRegion.save();
      },
      upsertRegion(filter: QueryFilter<IRegion>, update: Partial<IRegion>) {
        return this.findOneAndUpdate(filter, update, { upsert: true });
      },
    },
  }
);

export const Region =
  (models.Region as IRegionModel) ||
  (model<IRegion, IRegionModel>(
    'Region',
    regionSchema,
    'regions'
  ) as IRegionModel);
