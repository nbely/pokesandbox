import { Schema, Types } from 'mongoose';
import { z } from 'zod';

// Zod Validation Schemas

/**
 * Numeric requirement — e.g. badges >= 2, badges <= 5
 */
export const numericRequirementSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
}).refine((data) => data.min !== undefined || data.max !== undefined, {
  message: 'At least one of min or max must be provided',
});

/**
 * Exact match requirement — e.g. rocket_defeated === true, or specific milestone keys
 */
export const equalityRequirementSchema = z.object({
  equals: z.union([z.boolean(), z.string(), z.number(), z.array(z.string())]),
});

/**
 * Progression requirements — keys must match a region's progressionDefinitions keys.
 * Supports numeric checks (milestone count, numeric value) and equality checks (boolean flags).
 */
export const progressionRequirementSchema = z.record(
  z.string(),
  z.union([numericRequirementSchema, equalityRequirementSchema])
);

/**
 * Inventory ownership requirement
 */
export const itemRequirementSchema = z.object({
  itemId: z.instanceof(Types.ObjectId),
  minQuantity: z.number().default(1),
});

/**
 * Capability requirements (future-friendly)
 */
export const capabilityRequirementSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pokemon_move'),
    move: z.string(),
  }),
  z.object({
    type: z.literal('party_size'),
    min: z.number(),
  }),
]);

/**
 * Full reusable Requirement Set
 */
export const requirementSchema = z.object({
  progressions: progressionRequirementSchema.optional(),
  items: z.array(itemRequirementSchema).optional(),
  capabilities: z.array(capabilityRequirementSchema).optional(),
});

export type Requirement = z.infer<typeof requirementSchema>;

// Mongoose Model Schemas

const itemRequirementDbSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    minQuantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const capabilityRequirementDbSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pokemon_move', 'party_size'],
      required: true,
    },
    // pokemon_move
    move: { type: String },
    // party_size
    min: { type: Number },
  },
  { _id: false }
);

export const requirementDbSchema = new Schema(
  {
    progressions: {
      type: Map,
      of: Schema.Types.Mixed,
      required: false,
    },
    items: {
      type: [itemRequirementDbSchema],
      required: false,
    },
    capabilities: {
      type: [capabilityRequirementDbSchema],
      required: false,
    },
  },
  { _id: false }
);
