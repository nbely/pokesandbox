import { Schema } from 'mongoose';
import { z } from 'zod';

// Zod Validation Schemas

const progressionBaseSchema = z.object({
  displayName: z.string(),
  description: z.string().optional(),
  visibility: z
    .enum(['public', 'discoverable', 'hidden'])
    .optional()
    .default('public'),
});

const numericProgressionSchema = progressionBaseSchema.extend({
  kind: z.literal('numeric'),
  min: z.number().optional(),
  max: z.number().optional(),
});

const milestoneSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  ordinal: z.number().optional(),
});

const milestoneProgressionSchema = progressionBaseSchema.extend({
  kind: z.literal('milestone'),
  sequential: z.boolean().optional().default(false),
  milestones: z.array(milestoneSchema),
});

const booleanProgressionSchema = progressionBaseSchema.extend({
  kind: z.literal('boolean'),
});

export const progressionDefinitionSchema = z.discriminatedUnion('kind', [
  numericProgressionSchema,
  milestoneProgressionSchema,
  booleanProgressionSchema,
]);

export type ProgressionDefinition = z.infer<typeof progressionDefinitionSchema>;

// Mongoose Model Schemas

const milestoneDbSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    ordinal: { type: Number },
  },
  { _id: false }
);

export const progressionDefinitionDbSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['numeric', 'milestone', 'boolean'],
      required: true,
    },

    displayName: { type: String, required: true },
    description: { type: String },

    visibility: {
      type: String,
      enum: ['public', 'discoverable', 'hidden'],
      default: 'public',
    },

    // numeric
    min: { type: Number },
    max: { type: Number },

    // milestone
    sequential: { type: Boolean, default: false },
    milestones: {
      type: [milestoneDbSchema],
      default: [],
    },
  },
  { _id: false }
);
