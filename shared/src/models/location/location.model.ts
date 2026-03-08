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
import { wildTableDbSchema, wildTableSchema } from './wildTable';

// Zod Validation Schemas

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
  ordinal: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ILocation = z.infer<typeof locationEntitySchema>;
export type ILocationInput = Omit<ILocation, 'createdAt' | 'updatedAt' | 'ordinal'> & {
  ordinal?: number;
};
export type ILocationUpdate = Partial<ILocationInput>;
export type Location = HydratedDocument<ILocation>;

// Define interface for query helpers
interface ILocationQueryHelpers {
  byIds(ids: string[]): QueryWithHelpers<any, Location, ILocationQueryHelpers>;
  byRegionId(
    regionId: string
  ): QueryWithHelpers<any, Location, ILocationQueryHelpers>;
}

interface ILocationModel extends Model<ILocation, ILocationQueryHelpers> {
  createLocation(location: ILocationInput): Promise<Location>;
  upsertLocation(
    filter: QueryFilter<ILocation>,
    update: ILocationUpdate
  ): Query<Location | null, ILocation>;
}

// Mongoose Model Schemas

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
    ordinal: { type: Number, required: true },
  },
  {
    timestamps: true,
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
      async createLocation(location: ILocationInput) {
        // Auto-assign ordinal if not provided
        let ordinal = location.ordinal;
        if (ordinal === undefined) {
          const maxLocation = await this.findOne({ regionId: location.regionId })
            .sort({ ordinal: -1 })
            .select('ordinal')
            .lean();
          ordinal = (maxLocation?.ordinal ?? 0) + 1;
        }

        const newLocation = new this({ ...location, ordinal });
        return newLocation.save();
      },
      upsertLocation(filter: QueryFilter<ILocation>, update: ILocationUpdate) {
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
