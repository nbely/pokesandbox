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

import { collectionSeedMap, SUPPORTED_COLLECTIONS } from './collections';

const DATABASE_URI =
  process.env.DATABASE_URI || 'mongodb://localhost:27017/pokesandbox';

async function dropCollections(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const existing = await db
    .listCollections()
    .toArray()
    .then((cols) => cols.map((c) => c.name));

  for (const name of SUPPORTED_COLLECTIONS) {
    if (existing.includes(name)) {
      await db.dropCollection(name);
      console.info(`  Dropped collection: ${name}`);
    }
  }
}

async function main(): Promise<void> {
  console.info(`Connecting to MongoDB at ${DATABASE_URI}…`);
  await mongoose.connect(DATABASE_URI);
  console.info('Connected.\n');

  console.info('Resetting collections…');
  await dropCollections();

  for (const [name, { model, seedData }] of Object.entries(collectionSeedMap)) {
    if (!Array.isArray(seedData)) {
      console.warn(`  Skipping ${name}: seed data is not an array.`);
      continue;
    }
    console.info(`Seeding ${name}…`);
    await model.insertMany(seedData);
    console.info(`  Inserted ${seedData.length} ${name}.`);
  }

  console.info('\n✅ Database seeded successfully.');
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
