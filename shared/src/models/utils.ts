import { z } from 'zod';

/**
 * A reusable Zod utility that converts a JSON record/object
 * into a native JavaScript Map during parsing.
 */
export const zMapHydrator = <T extends z.ZodTypeAny>(valueSchema: T) => {
  return z
    .union([
      // 1. If it's already a Map, pass through
      z.instanceof(Map),

      // 2. If it's a plain object (Record), validate and transform it
      z.record(valueSchema),
    ])
    .transform((val) => {
      // If already a Map, return as-is
      if (val instanceof Map) {
        return val;
      }
      // Otherwise convert Record to Map
      return new Map(Object.entries(val));
    }) as z.ZodType<Map<string, z.infer<T>>>;
};
