import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { Region } from '../models/region.model';

export async function createRegion(input: Region) {
  const user: HydratedDocument<Region> = new Region(input);
  return await user.save();
}

export async function deleteAllRegions() {
  return Region.deleteMany({}).exec();
}

export async function findAllRegions(options: QueryOptions = { lean: true }) {
  return Region.find({}, null, options).exec();
}

export async function findRegion(
  query: FilterQuery<Region>,
  options: QueryOptions = { lean: true }
) {
  return await Region.findOne(query, null, options).exec();
}

export async function findRegionsByObjectIds(
  objectIds: Types.ObjectId[],
  options: QueryOptions = { lean: true }
) {
  return Region.find({ _id: { $in: objectIds } }, null, options).exec();
}

export async function upsertRegion(
  query: FilterQuery<Region>,
  update: UpdateQuery<Region>,
  options: QueryOptions = { lean: true, upsert: true }
) {
  return Region.findOneAndUpdate(query, update, options).exec();
}
