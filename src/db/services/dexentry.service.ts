import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";
import DexEntry, { IDexEntryModel } from "../models/dexentry.model";

export async function createDexEntry(input: IDexEntryModel) {
  const user: HydratedDocument<IDexEntryModel> = new DexEntry(input);
  return await user.save();
}

export async function deleteAllDexEntries() {
  return DexEntry.deleteMany({}).exec();
}

export async function findDexEntry(
  query: FilterQuery<IDexEntryModel>,
  options: QueryOptions = { lean: true },
) {
  return DexEntry.findOne(query, null, options).exec();
}

export async function findDexEntriesByObjectIds(
  objectIds: Types.ObjectId[],
  options: QueryOptions = { lean: true },
) {
  return DexEntry.find({ _id: { $in: objectIds } }, null, options).exec();
}

export async function upsertDexEntry(
  query: FilterQuery<IDexEntryModel>,
  update: UpdateQuery<IDexEntryModel>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return DexEntry.findOneAndUpdate(query, update, options).exec();
}
