import { z } from 'zod';
import { Schema, Types } from 'mongoose';

export const pokedexSlotSchema = z
  .object({
    id: z.instanceof(Types.ObjectId),
    name: z.string(),
    isBaseFormNotIncluded: z.boolean().optional(),
    baseFormOrdinal: z.number().optional(),
    includedForms: z
      .array(
        z.object({
          id: z.instanceof(Types.ObjectId),
          ordinal: z.number(),
        })
      )
      .optional(),
  })
  .nullable();

export const PokedexSlotSchema = new Schema({
  id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
  name: String,
  isBaseFormNotIncluded: Boolean,
  baseFormOrdinal: Number,
  includedForms: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'DexEntry' },
      ordinal: Number,
    },
  ],
});
