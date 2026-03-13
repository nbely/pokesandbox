import { Types } from 'mongoose';

import { getCacheService } from '@shared/cache';
import { Location } from '@shared/models';

import { CachePrefix, CacheTTL } from './constants';
import { toIdStrings } from './utils';

/**
 * Fetch a single location by its ID, hitting the cache first.
 */
export async function getCachedLocation(
  locationId: string | Types.ObjectId | undefined
): Promise<Location | null> {
  if (!locationId) return null;

  const cache = getCacheService();
  const id = locationId.toString();
  const key = `${CachePrefix.LOCATION}${id}`;

  const cached = cache.get<Location>(key);
  if (cached) return cached;

  const location = await Location.findById(id).exec();
  if (location) {
    cache.set(key, location, CacheTTL.LOCATION);
  }
  return location;
}

/**
 * Fetch multiple locations by ObjectId or string IDs, hitting the cache first.
 * Only queries the DB for IDs not already cached, then backfills those into
 * the cache so subsequent reads are instant.
 */
export async function getCachedLocations(
  ids: (Types.ObjectId | string)[]
): Promise<Location[]> {
  if (!ids.length) return [];

  const cache = getCacheService();
  const stringIds = toIdStrings(ids);

  const locationMap = new Map<string, Location>();
  const missIds: string[] = [];

  // Check cache for each ID
  for (const id of stringIds) {
    const cached = cache.get<Location>(`${CachePrefix.LOCATION}${id}`);
    if (cached) {
      locationMap.set(id, cached);
    } else {
      missIds.push(id);
    }
  }

  // Fetch cache misses from DB
  if (missIds.length > 0) {
    const fetched = await Location.find().byIds(missIds).exec();
    for (const location of fetched) {
      cache.set(
        `${CachePrefix.LOCATION}${location.id}`,
        location,
        CacheTTL.LOCATION
      );
      locationMap.set(location.id, location);
    }
  }

  // Return locations in original ID order, filtering out any not found
  return stringIds
    .map((id) => locationMap.get(id))
    .filter((location): location is Location => location !== undefined);
}

/**
 * Invalidate the cached location for a given ID (internal).
 */
function invalidateLocationCache(locationId: string): void {
  const cache = getCacheService();
  cache.del(`${CachePrefix.LOCATION}${locationId}`);
}

/**
 * Save a location document and invalidate its cache entry.
 */
export async function saveLocation(location: Location): Promise<void> {
  await location.save();
  invalidateLocationCache(location.id);
}
