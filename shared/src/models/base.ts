import { z } from 'zod';

/**
 * Base zod schema that includes createdAt/updatedAt audit timestamps.
 * Extend this schema for all entity schemas that require audit timestamps.
 */
export const baseEntitySchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Generic input type that omits managed timestamp fields.
 * Use for create/update operations to prevent clients from setting timestamps.
 */
export type IModelInput<T> = Omit<T, 'createdAt' | 'updatedAt'>;
