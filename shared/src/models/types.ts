import type { Query } from 'mongoose';

/**
 * Generic type for Mongoose queries that populate one or more fields with related documents.
 *
 * @template TResult - The expected result shape (Doc | null, Doc, or Doc[])
 * @template TDoc - The base document interface (e.g., IUser, IServer)
 * @template TPopulatedFields - Object type mapping field names to their populated types
 *
 * @example Single field population (nullable):
 * ```typescript
 * findUserWithServers(
 *   filter: QueryFilter<IUser>
 * ): PopulatedQuery<User | null, IUser, { servers: Server[] }>;
 * ```
 *
 * @example Multiple field population (array):
 * ```typescript
 * findServersWithRegions(
 *   filter: QueryFilter<IServer>
 * ): PopulatedQuery<Server[], IServer, { regions: Region[] }>;
 * ```
 */
export type PopulatedQuery<TResult, TDoc, TPopulatedFields> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TResult extends any[]
    ? Query<
        (Omit<TResult[number], keyof TPopulatedFields> & TPopulatedFields)[],
        TDoc
      >
    : TResult extends null
    ? Query<null, TDoc>
    : Query<
        null extends TResult
          ?
              | (Omit<Exclude<TResult, null>, keyof TPopulatedFields> &
                  TPopulatedFields)
              | null
          : Omit<TResult, keyof TPopulatedFields> & TPopulatedFields,
        TDoc
      >;
