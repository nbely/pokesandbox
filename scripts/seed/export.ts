/**
 * Database export script.
 *
 * Reads documents from the live local MongoDB instance and writes them to the
 * JSON seed-data files in scripts/seed/data/.  Overwrites the existing files so
 * they always reflect the current state of your local database.
 *
 * Usage:
 *   npm run db:export                        # export all seeded collections
 *   npm run db:export -- --collection=users  # export a single collection
 *
 * Supported collections: users, servers, regions
 */

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

import { SUPPORTED_COLLECTIONS, type SupportedCollection } from './collections';

const DATABASE_URI =
  process.env.DATABASE_URI || 'mongodb://localhost:27017/pokesandbox';

const DATA_DIR = path.join(__dirname, 'data');

/**
 * Recursively converts any BSON ObjectId values to plain 24-char hex strings
 * so the resulting JSON is human-readable and git-friendly.
 */
function toPlainObject(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // BSON ObjectId instances expose toHexString()
  if (
    typeof value === 'object' &&
    typeof (value as any).toHexString === 'function'
  ) {
    return (value as any).toHexString();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainObject);
  }

  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) {
      obj[k] = toPlainObject(v);
    }
    return obj;
  }

  if (typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      obj[k] = toPlainObject(v);
    }
    return obj;
  }

  return value;
}

async function exportCollection(
  collectionName: SupportedCollection
): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('No active database connection.');

  const docs = await db.collection(collectionName).find({}).toArray();
  const serialized = docs.map(toPlainObject);

  const outputPath = path.join(DATA_DIR, `${collectionName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(serialized, null, 2) + '\n');

  console.info(
    `  Exported ${docs.length} document(s) → ${path.relative(
      process.cwd(),
      outputPath
    )}`
  );
}

async function main(): Promise<void> {
  // Resolve which collections to export
  const collectionArg = process.argv
    .find((a) => a.startsWith('--collection='))
    ?.split('=')[1] as SupportedCollection | undefined;

  if (collectionArg && !SUPPORTED_COLLECTIONS.includes(collectionArg)) {
    console.error(
      `Unknown collection "${collectionArg}". Supported: ${SUPPORTED_COLLECTIONS.join(
        ', '
      )}`
    );
    process.exit(1);
  }

  const targets: SupportedCollection[] = collectionArg
    ? [collectionArg]
    : [...SUPPORTED_COLLECTIONS];

  console.info(`Connecting to MongoDB at ${DATABASE_URI}…`);
  await mongoose.connect(DATABASE_URI);
  console.info('Connected.\n');

  for (const col of targets) {
    console.info(`Exporting ${col}…`);
    await exportCollection(col);
  }

  console.info('\n✅ Export complete.');
}

main()
  .catch((err) => {
    console.error('Export script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
