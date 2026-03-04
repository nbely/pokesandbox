import { Model } from 'mongoose';
import { DexEntry, Location, Region, Server, User } from '../../shared/src/models/index';

// Load seed data from JSON files
import dexEntriesData from './data/dexentries.json';
import locationsData from './data/locations.json';
import regionsData from './data/regions.json';
import serversData from './data/servers.json';
import usersData from './data/users.json';

export type SupportedCollection =
  | 'dexentries'
  | 'locations'
  | 'regions'
  | 'servers'
  | 'users';
export const collectionSeedMap: Record<
  SupportedCollection,
  { model: Model<any>; seedData: any }
> = {
  dexentries: { model: DexEntry, seedData: dexEntriesData },
  locations: { model: Location, seedData: locationsData },
  regions: { model: Region, seedData: regionsData },
  servers: { model: Server, seedData: serversData },
  users: { model: User, seedData: usersData },
};

export const SUPPORTED_COLLECTIONS = Array.from(
  Object.keys(collectionSeedMap)
) as SupportedCollection[];
