import { Types } from 'mongoose';

/**
 * Normalise a Mongoose ObjectId or string into a plain string ID.
 */
export function toIdString(id: Types.ObjectId | string): string {
  return id instanceof Types.ObjectId ? id.toString() : id;
}

/**
 * Normalise an array of Mongoose ObjectIds or strings into plain string IDs.
 */
export function toIdStrings(ids: (Types.ObjectId | string)[]): string[] {
  return ids.map(toIdString);
}
