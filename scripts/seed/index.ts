/**
 * Database seed script.
 *
 * Drops all seeded collections and re-inserts data from the JSON files in
 * scripts/seed/data/.  Cross-references (user.servers, server.regions) are
 * already embedded in the JSON files, so no back-linking step is required.
 *
 * Update the JSON files by running:
 *   npm run db:export                        # export all collections
 *   npm run db:export -- --collection=users  # export a single collection
 *
 * Usage:
 *   npm run db:seed   # clear + seed
 *   npm run db:reset  # alias for db:seed
 */

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env from repo root
dotenv.config();

// Import models — side-effect: registers schemas with Mongoose
import { User } from '../../shared/src/models/user.model';
import { Server } from '../../shared/src/models/server.model';
import { Region } from '../../shared/src/models/region/region.model';

// Load seed data from JSON files
import usersData from './data/users.json';
import serversData from './data/servers.json';
import regionsData from './data/regions.json';

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
  await User.insertMany(usersData as any[]);
  console.info(`  Inserted ${usersData.length} users.`);
}

async function seedServers(): Promise<void> {
  console.info('\nSeeding servers…');
  await Server.insertMany(serversData as any[]);
  console.info(`  Inserted ${serversData.length} servers.`);
}

async function seedRegions(): Promise<void> {
  console.info('\nSeeding regions…');
  await Region.insertMany(regionsData as any[]);
  console.info(`  Inserted ${regionsData.length} regions.`);
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

  console.info('\n✅ Database seeded successfully.');
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
