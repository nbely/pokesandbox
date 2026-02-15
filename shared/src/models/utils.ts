import { z } from 'zod';

/**
 * A reusable Zod utility that converts a JSON record/object
 * into a native JavaScript Map during parsing.
 */
export const zMapHydrator = <T extends z.ZodTypeAny>(valueSchema: T) => {
  return z.union([
    // 1. If it's already a Map, validate its values but leave it as-is
    z.instanceof(Map),

    // 2. If it's a plain object (Record), validate and transform it
    z.record(valueSchema).transform((val) => new Map(Object.entries(val))),
  ]);
};
