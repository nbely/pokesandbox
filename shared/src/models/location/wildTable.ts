import { Schema, Types } from 'mongoose';
import z from 'zod';

// Zod Validation Schemas

/**
 * Encounter slot — a single species entry in a wild encounter table
 */
const encounterSlotSchema = z.object({
  speciesId: z.instanceof(Types.ObjectId),
  minLevel: z.number().int(),
  maxLevel: z.number().int(),
  weight: z.number().int().positive(),
});

/**
 * Time-of-day encounter block
 */
const timeEncounterBlockSchema = z.object({
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

export const wildTableDbSchema = new Schema(
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
