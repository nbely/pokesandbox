import { getCacheService } from '@shared/cache';
import { Server } from '@shared/models';

import { CachePrefix, CacheTTL } from './constants';

/**
 * Fetch a server by Discord guild ID, hitting the cache first.
 */
export async function getCachedServer(
  guildId: string | undefined
): Promise<Server | null> {
  if (!guildId) return null;

  const cache = getCacheService();
  const key = `${CachePrefix.SERVER}${guildId}`;

  const cached = cache.get<Server>(key);
  if (cached) return cached;

  const server = await Server.findOne().byServerId(guildId).exec();
  if (server) {
    cache.set(key, server, CacheTTL.SERVER);
  }
  return server;
}

/**
 * Invalidate the cached server for a given guild ID (internal).
 */
function invalidateServerCache(guildId: string): void {
  const cache = getCacheService();
  cache.del(`${CachePrefix.SERVER}${guildId}`);
}

/**
 * Save a server document and invalidate its cache entry.

 */
export async function saveServer(server: Server): Promise<void> {
  await server.save();
  invalidateServerCache(server.serverId);
}
