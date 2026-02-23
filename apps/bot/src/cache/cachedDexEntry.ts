import { Types } from 'mongoose';

import { getCacheService } from '@shared/cache';
import { DexEntry } from '@shared/models';

import { CachePrefix, CacheTTL } from './constants';
import { toIdString, toIdStrings } from './utils';

/**
 * Fetch a dex entry by its ObjectId or string ID, hitting the cache first.
 */
export async function getCachedDexEntry(
  dexEntryId?: Types.ObjectId | string
): Promise<DexEntry | null> {
  if (!dexEntryId) return null;
  const normalisedDexEntryId = toIdString(dexEntryId); // Ensure it's a string for consistent cache keys

  const cache = getCacheService();
  const key = `${CachePrefix.DEX_ENTRY}${normalisedDexEntryId}`;

  const cached = cache.get<DexEntry>(key);
  if (cached) return cached;

  const dexEntry = await DexEntry.findById(normalisedDexEntryId).exec();
  if (dexEntry) {
    cache.set(key, dexEntry, CacheTTL.DEX_ENTRY);
  }
  return dexEntry;
}

export async function getAssertedCachedDexEntry(
  dexEntryId?: Types.ObjectId | string
): Promise<DexEntry> {
  const dexEntry = await getCachedDexEntry(dexEntryId);

  if (!dexEntry) {
    throw new Error(
      `There was a problem fetching the dex entry. Please try again later.`
    );
  }

  return dexEntry;
}

/**
 * Fetch multiple dex entries by ObjectId or string IDs, hitting the cache first.
 * Only queries the DB for IDs not already cached, then backfills those into
 * the cache so subsequent reads are instant.
 */
export async function getCachedDexEntries(
  ids: (Types.ObjectId | string)[]
): Promise<DexEntry[]> {
  if (!ids.length) return [];

  const cache = getCacheService();
  const stringIds = toIdStrings(ids);

  const dexEntryMap = new Map<string, DexEntry>();
  const missIds: string[] = [];

  // Check cache for each ID
  for (const id of stringIds) {
    const cached = cache.get<DexEntry>(`${CachePrefix.DEX_ENTRY}${id}`);
    if (cached) {
      dexEntryMap.set(id, cached);
    } else {
      missIds.push(id);
    }
  }

  // Fetch cache misses from DB
  if (missIds.length > 0) {
    const fetched = await DexEntry.find().byIds(missIds).exec();
    for (const dexEntry of fetched) {
      cache.set(
        `${CachePrefix.DEX_ENTRY}${dexEntry.id}`,
        dexEntry,
        CacheTTL.DEX_ENTRY
      );
      dexEntryMap.set(dexEntry.id, dexEntry);
    }
  }

  // Return dex entries in original ID order, filtering out any not found
  return stringIds
    .map((id) => dexEntryMap.get(id))
    .filter((dexEntry): dexEntry is DexEntry => dexEntry !== undefined);
}
