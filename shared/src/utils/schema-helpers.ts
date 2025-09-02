import { z } from 'zod';

/**
 * Creates a request DTO schema by omitting the _id field from an entity schema.
 * This is a common pattern when creating database records where the _id is auto-generated.
 * 
 * @param entitySchema - The entity schema that includes an _id field
 * @returns A new schema with the _id field omitted, suitable for request DTOs
 */
export function createRequestDTOSchema<
  T extends z.ZodObject<z.ZodRawShape & { _id: z.ZodTypeAny }>
>(entitySchema: T) {
  return entitySchema.omit({ _id: true });
}