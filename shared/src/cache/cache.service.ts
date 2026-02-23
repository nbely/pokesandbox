import type { ICacheService } from './cache.interface';
import {
  NodeCacheAdapter,
  type NodeCacheAdapterOptions,
} from './node-cache.adapter';

let instance: ICacheService | null = null;

/**
 * Returns the singleton cache service.
 *
 * On first call, creates a `NodeCacheAdapter` with the supplied options.
 * Subsequent calls return the same instance (options are ignored).
 *
 * When you're ready to migrate to Redis, change this factory to
 * instantiate a `RedisCacheAdapter` instead — no consumer code changes.
 */
export function getCacheService(
  options?: NodeCacheAdapterOptions
): ICacheService {
  if (!instance) {
    instance = new NodeCacheAdapter(options);
  }
  return instance;
}

/**
 * Replace the singleton with a custom implementation (useful for tests
 * or for swapping in Redis at runtime).
 */
export function setCacheService(service: ICacheService): void {
  instance = service;
}

/**
 * Reset the singleton (primarily for test teardown).
 */
export function resetCacheService(): void {
  instance?.flush();
  instance = null;
}
