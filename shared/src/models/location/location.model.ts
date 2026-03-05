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

import { requirementDbSchema, requirementSchema } from '../requirement';

// Zod Validation Schemas

/**
 * Encounter slot — a single species entry in a wild encounter table
 */
export const encounterSlotSchema = z.object({
  speciesId: z.instanceof(Types.ObjectId),
  minLevel: z.number().int(),
  maxLevel: z.number().int(),
  weight: z.number().int().positive(),
});

/**
 * Time-of-day encounter block
 */
export const timeEncounterBlockSchema = z.object({
  timeOfDay: z.enum(['morning', 'day', 'evening', 'night', 'any']),
  slots: z.array(encounterSlotSchema),
});

/**
 * Wild encounter table — grouped by encounter method
 */
export const wildTableSchema = z.object({
  encounterType: z.enum([
    'grass',
    'surf',
    'old_rod',
    'good_rod',
    'super_rod',
    'rock_smash',
    'gift',
  ]),
  timeBlocks: z.array(timeEncounterBlockSchema),
});

/**
 * Directional connection between locations
 */
export const connectionSchema = z.object({
  toLocationId: z.instanceof(Types.ObjectId),
  requirements: requirementSchema.optional(),
});

/**
 * Location entity — an explorable area within a Region
 */
export const locationEntitySchema = z.object({
  name: z.string(),
  regionId: z.instanceof(Types.ObjectId),
  requirements: requirementSchema.optional(),
  connections: z.array(connectionSchema),
  trainerIds: z.array(z.instanceof(Types.ObjectId)).default([]),
  wildTables: z.array(wildTableSchema).optional(),
});

export type ILocation = z.infer<typeof locationEntitySchema>;
export type Location = HydratedDocument<ILocation>;

// Define interface for query helpers
interface ILocationQueryHelpers {
  byIds(ids: string[]): QueryWithHelpers<any, Location, ILocationQueryHelpers>;
  byRegionId(
    regionId: string
  ): QueryWithHelpers<any, Location, ILocationQueryHelpers>;
}

interface ILocationModel extends Model<ILocation, ILocationQueryHelpers> {
  createLocation(location: ILocation): Promise<Location>;
  upsertLocation(
    filter: QueryFilter<ILocation>,
    update: Partial<ILocation>
  ): Query<Location | null, ILocation>;
}

// Mongoose Model Schemas

const encounterSlotDbSchema = new Schema(
  {
    speciesId: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: true },
    minLevel: { type: Number, required: true },
    maxLevel: { type: Number, required: true },
    weight: { type: Number, required: true },
  },
  { _id: false }
);

const timeEncounterBlockDbSchema = new Schema(
  {
    timeOfDay: {
      type: String,
      enum: ['morning', 'day', 'evening', 'night', 'any'],
      required: true,
    },
    slots: { type: [encounterSlotDbSchema], required: true },
  },
  { _id: false }
);

const wildTableDbSchema = new Schema(
  {
    encounterType: {
      type: String,
      enum: [
        'grass',
        'surf',
        'old_rod',
        'good_rod',
        'super_rod',
        'rock_smash',
        'gift',
      ],
      required: true,
    },
    timeBlocks: { type: [timeEncounterBlockDbSchema], required: true },
  },
  { _id: false }
);

const connectionDbSchema = new Schema(
  {
    toLocationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    requirements: { type: requirementDbSchema, required: false },
  },
  { _id: false }
);

export const locationSchema = new Schema<
  ILocation,
  ILocationModel,
  Record<string, never>,
  ILocationQueryHelpers
>(
  {
    name: { type: String, required: true },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: 'Region',
      required: true,
    },
    requirements: { type: requirementDbSchema, required: false },
    connections: { type: [connectionDbSchema], required: true },
    trainerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Trainer',
      default: [],
    },
    wildTables: { type: [wildTableDbSchema], required: false },
  },
  {
    query: {
      byIds(
        this: QueryWithHelpers<any, Location, ILocationQueryHelpers>,
        ids: string[]
      ) {
        return this.where({ _id: { $in: ids } });
      },
      byRegionId(
        this: QueryWithHelpers<any, Location, ILocationQueryHelpers>,
        regionId: string
      ) {
        return this.where({ regionId });
      },
    },
    statics: {
      createLocation(location: ILocation) {
        const newLocation = new this(location);
        return newLocation.save();
      },
      upsertLocation(
        filter: QueryFilter<ILocation>,
        update: Partial<ILocation>
      ) {
        return this.findOneAndUpdate(filter, update, { upsert: true });
      },
    },
  }
);

export const Location =
  (models.Location as ILocationModel) ||
  (model<ILocation, ILocationModel>(
    'Location',
    locationSchema,
    'locations'
  ) as ILocationModel);
