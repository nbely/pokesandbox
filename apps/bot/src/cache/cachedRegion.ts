import { Types } from 'mongoose';

import { getCacheService } from '@shared/cache';
import { Region } from '@shared/models';

import { CachePrefix, CacheTTL } from './constants';
import { toIdStrings } from './utils';

/**
 * Fetch a region by its ObjectId string, hitting the cache first.
 */
export async function getCachedRegion(
  regionId: string | undefined
): Promise<Region | null> {
  if (!regionId) return null;

  const cache = getCacheService();
  const key = `${CachePrefix.REGION}${regionId}`;

  const cached = cache.get<Region>(key);
  if (cached) return cached;

  const region = await Region.findById(regionId).exec();
  if (region) {
    cache.set(key, region, CacheTTL.REGION);
  }
  return region;
}

export async function getAssertedCachedRegion(
  regionId: string
): Promise<Region> {
  const region = await getCachedRegion(regionId);

  if (!region) {
    throw new Error(
      'There was a problem fetching the region. Please try again later.'
    );
  }

  return region;
}

/**
 * Fetch multiple regions by ObjectId or string IDs, hitting the cache first.
 * Only queries the DB for IDs not already cached, then backfills those into
 * the cache so subsequent reads are instant.
 */
export async function getCachedRegions(
  ids: (Types.ObjectId | string)[]
): Promise<Region[]> {
  if (!ids.length) return [];

  const cache = getCacheService();
  const stringIds = toIdStrings(ids);

  const regionMap = new Map<string, Region>();
  const missIds: string[] = [];

  // Check cache for each ID
  for (const id of stringIds) {
    const cached = cache.get<Region>(`${CachePrefix.REGION}${id}`);
    if (cached) {
      regionMap.set(id, cached);
    } else {
      missIds.push(id);
    }
  }

  // Fetch cache misses from DB
  if (missIds.length > 0) {
    const fetched = await Region.find().byIds(missIds).exec();
    for (const region of fetched) {
      cache.set(`${CachePrefix.REGION}${region.id}`, region, CacheTTL.REGION);
      regionMap.set(region.id, region);
    }
  }

  // Return regions in original ID order, filtering out any not found
  return stringIds
    .map((id) => regionMap.get(id))
    .filter((region): region is Region => region !== undefined);
}

/**
 * Invalidate the cached region for a given ID (internal).
 */
function invalidateRegionCache(regionId: string): void {
  const cache = getCacheService();
  cache.del(`${CachePrefix.REGION}${regionId}`);
}

/**
 * Save a region document and invalidate its cache entry.
 */
export async function saveRegion(region: Region): Promise<void> {
  await region.save();
  invalidateRegionCache(region.id);
}
