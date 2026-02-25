/**
 * Database seed script.
 *
 * Drops all seeded collections and re-inserts fictional data.
 * Accepts an optional --reset flag (no-op; reset is always performed).
 *
 * Usage:
 *   npm run db:seed          # clear + seed
 *   npm run db:reset         # alias for db:seed
 */

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env from repo root
dotenv.config();

// Import models — side-effect: registers schemas with Mongoose
import { User } from '../../shared/src/models/user.model';
import { Server } from '../../shared/src/models/server.model';
import { Region } from '../../shared/src/models/region/region.model';

// Import seed data
import { users } from './data/users';
import { servers } from './data/servers';
import { regions, serverRegionMap } from './data/regions';

const DATABASE_URI =
  process.env.DATABASE_URI || 'mongodb://localhost:27017/pokesandbox';

async function dropCollections(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const collectionNames = ['users', 'servers', 'regions', 'dexentries'];
  const existing = await db
    .listCollections()
    .toArray()
    .then((cols) => cols.map((c) => c.name));

  for (const name of collectionNames) {
    if (existing.includes(name)) {
      await db.dropCollection(name);
      console.info(`  Dropped collection: ${name}`);
    }
  }
}

async function seedUsers(): Promise<void> {
  console.info('\nSeeding users…');
  await User.insertMany(users);
  console.info(`  Inserted ${users.length} users.`);
}

async function seedServers(): Promise<void> {
  console.info('\nSeeding servers…');

  // Back-populate server.regions before inserting
  const enrichedServers = servers.map((server) => ({
    ...server,
    regions: serverRegionMap[server._id.toHexString()] ?? [],
  }));

  await Server.insertMany(enrichedServers);
  console.info(`  Inserted ${enrichedServers.length} servers.`);
}

async function seedRegions(): Promise<void> {
  console.info('\nSeeding regions…');
  await Region.insertMany(regions);
  console.info(`  Inserted ${regions.length} regions.`);
}

async function updateUserServers(): Promise<void> {
  console.info('\nLinking users → servers…');

  // Map each user to the servers they appear in
  const userServerMap: Record<string, mongoose.Types.ObjectId[]> = {};

  for (const server of servers) {
    for (const userId of server.playerList) {
      const key = userId.toHexString();
      if (!userServerMap[key]) userServerMap[key] = [];
      userServerMap[key].push(server._id);
    }
  }

  for (const [userObjectId, serverList] of Object.entries(userServerMap)) {
    await User.findByIdAndUpdate(userObjectId, {
      $set: { servers: serverList },
    });
  }

  console.info('  User ↔ server links updated.');
}

async function main(): Promise<void> {
  console.info(`Connecting to MongoDB at ${DATABASE_URI}…`);
  await mongoose.connect(DATABASE_URI);
  console.info('Connected.\n');

  console.info('Resetting collections…');
  await dropCollections();

  await seedUsers();
  await seedServers();
  await seedRegions();
  await updateUserServers();

  console.info('\n✅ Database seeded successfully.');
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
