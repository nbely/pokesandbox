import NodeCache from 'node-cache';

import type { ICacheService } from './cache.interface';

export interface NodeCacheAdapterOptions {
  /** Default TTL in seconds for entries without an explicit TTL. Default: 300 (5 min). */
  defaultTtlSeconds?: number;
  /** How often (seconds) the internal check-period runs to prune expired keys. Default: 120. */
  checkPeriodSeconds?: number;
}

/**
 * In-process cache backed by `node-cache`.
 *
 * Ideal for single-process bots where all reads/writes happen in the
 * same Node runtime.  When the bot outgrows a single process (e.g.
 * Discord sharding across workers), swap this adapter for a Redis one.
 */
export class NodeCacheAdapter implements ICacheService {
  private cache: NodeCache;

  constructor(options: NodeCacheAdapterOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.defaultTtlSeconds ?? 300,
      checkperiod: options.checkPeriodSeconds ?? 120,
      useClones: false, // return refs — avoids unnecessary deep-cloning
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, value, ttlSeconds);
    } else {
      this.cache.set(key, value);
    }
  }

  del(key: string): boolean {
    return this.cache.del(key) > 0;
  }

  invalidateByPrefix(prefix: string): number {
    const matchingKeys = this.cache
      .keys()
      .filter((k: string) => k.startsWith(prefix));
    return this.cache.del(matchingKeys);
  }

  flush(): void {
    this.cache.flushAll();
  }

  keys(): string[] {
    return this.cache.keys();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}
