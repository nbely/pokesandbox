/**
 * Abstract cache service interface.
 *
 * Implementations can be swapped (node-cache → ioredis) without
 * changing any consumer code.  All keys are strings; values are
 * generic and serialised by the concrete adapter.
 */
export interface ICacheService {
  /** Retrieve a cached value, or `undefined` on miss. */
  get<T>(key: string): T | undefined;

  /** Store a value. `ttlSeconds` overrides the adapter default when provided. */
  set<T>(key: string, value: T, ttlSeconds?: number): void;

  /** Delete a single key. Returns `true` if the key existed. */
  del(key: string): boolean;

  /** Delete every key that starts with `prefix`. */
  invalidateByPrefix(prefix: string): number;

  /** Remove all entries from the cache. */
  flush(): void;

  /** Return all keys currently in the cache (useful for debugging). */
  keys(): string[];

  /** Check whether a key exists without retrieving its value. */
  has(key: string): boolean;
}
