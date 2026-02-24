/**
 * Cache key prefixes.
 *
 * Every cached entity type gets a unique prefix so that
 * `invalidateByPrefix` can surgically clear one entity type
 * without flushing the whole cache.
 */
export const CachePrefix = {
  SERVER: 'server:',
  REGION: 'region:',
  DEX_ENTRY: 'dex_entry:',
} as const;

/**
 * Default TTLs (seconds) per entity type.
 */
export const CacheTTL = {
  /** Server config rarely changes — 10 minutes. */
  SERVER: 600,
  /** Regions are edited more often during admin sessions — 5 minutes. */
  REGION: 300,
  /** Dex entries are essentially static *for now* — 30 minutes. */
  DEX_ENTRY: 1800,
} as const;
