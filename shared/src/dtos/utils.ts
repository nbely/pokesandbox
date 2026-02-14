import { type HydratedDocument, Types } from 'mongoose';

/**
 * Recursively converts all ObjectId types to strings in a type definition.
 * Designed for plain entity interfaces (e.g., IServer, IUser), NOT HydratedDocuments.
 * Use toPlainObject() to strip the document wrapper before applying this type.
 *
 * @template T - The plain interface type to convert
 *
 * @example
 * ```typescript
 * type ServerDTO = ConvertToDTO<IServer>;
 * // { serverId: string, regions: string[], playerList: string[], ... }
 * ```
 */
export type ConvertToDTO<T> = T extends Types.ObjectId
  ? string
  : T extends Date
  ? Date
  : T extends Array<infer U>
  ? Array<ConvertToDTO<U>>
  : T extends object
  ? { [K in keyof T]: ConvertToDTO<T[K]> }
  : T;

/**
 * Converts a Mongoose HydratedDocument to a plain JavaScript object.
 * Mongoose's toJSON() recursively handles nested/populated subdocuments.
 *
 * @param obj - A single Mongoose document, array of documents, or null
 * @returns A plain JavaScript object with Mongoose internals stripped
 *
 * @example
 * ```typescript
 * const server = await Server.findOne().populate('regions');
 * const plain = toPlainObject(server); // T inferred as IServer
 * ```
 */
export function toPlainObject<T>(obj: HydratedDocument<T>): T;
export function toPlainObject<T>(obj: HydratedDocument<T> | null): T | null;
export function toPlainObject<T>(obj: HydratedDocument<T>[]): T[];
export function toPlainObject(obj: unknown): unknown;
export function toPlainObject(obj: unknown): unknown {
  if (obj == null) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null && 'toJSON' in item
        ? item.toJSON()
        : item
    );
  }

  if (
    typeof obj === 'object' &&
    'toJSON' in obj &&
    typeof obj.toJSON === 'function'
  ) {
    return obj.toJSON();
  }

  return obj;
}

/**
 * Deeply converts all ObjectId instances in an object to hex strings.
 * Handles nested objects and arrays. Does NOT call toJSON — use toPlainObject first
 * if converting from a Mongoose document.
 *
 * @param obj - A plain object (not a Mongoose document)
 * @returns A new object with all ObjectId values converted to strings
 *
 * @example
 * ```typescript
 * const plain = { _id: new Types.ObjectId(), name: 'test' };
 * const converted = convertObjectIdsToStrings(plain);
 * // { _id: '507f1f77bcf86cd799439011', name: 'test' }
 * ```
 */
export function convertObjectIdsToStrings<T>(obj: T): ConvertToDTO<T>;
export function convertObjectIdsToStrings(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Types.ObjectId) return obj.toHexString();

  if (Array.isArray(obj)) {
    return obj.map((item) => convertObjectIdsToStrings(item));
  }

  if (obj instanceof Date) return obj;

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        result[key] = convertObjectIdsToStrings(record[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Converts a Mongoose document to a plain object with all ObjectIds as strings.
 * Composes toPlainObject() and convertObjectIdsToStrings().
 *
 * Overloads handle standard documents with precise typing.
 * For populated or modified document shapes (e.g., Omit<Server, 'regions'> & { regions: Region[] }),
 * the fallback overload returns `unknown` — rely on zod .parse() for type narrowing.
 *
 * @param obj - A Mongoose document, array of documents, null, or modified document shape
 * @returns A plain object with all ObjectIds converted to strings
 *
 * @example
 * ```typescript
 * const server = await Server.findOne();
 * const dto = convertToDTO(server); // ConvertToDTO<IServer>
 *
 * const populated = await Server.findServerWithRegions({ serverId });
 * const dto = serverWithRegionsDTOSchema.parse(convertToDTO(populated)); // zod narrows type
 * ```
 */
export function convertToDTO<T>(obj: HydratedDocument<T>): ConvertToDTO<T>;
export function convertToDTO<T>(
  obj: HydratedDocument<T> | null
): ConvertToDTO<T> | null;
export function convertToDTO<T>(obj: HydratedDocument<T>[]): ConvertToDTO<T>[];
export function convertToDTO(obj: unknown): unknown;
export function convertToDTO(obj: unknown): unknown {
  if (obj == null) return obj;
  return convertObjectIdsToStrings(toPlainObject(obj));
}
