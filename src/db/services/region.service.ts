import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";
import Region, { IRegionModel } from "../models/region.model";

export async function createRegion(input: IRegionModel) {
  const user: HydratedDocument<IRegionModel> = new Region(input);
  return await user.save();
}

export async function deleteAllRegions() {
  return Region.deleteMany({}).exec();
}

export async function findRegion(
  query: FilterQuery<IRegionModel>,
  options: QueryOptions = { lean: true },
) {
  return Region.findOne(query, null, options).exec();
}

export async function findRegionsByObjectIds(
  objectIds: Types.ObjectId[],
  options: QueryOptions = { lean: true },
) {
  return Region.find({ _id: { $in: objectIds } }, null, options).exec();
}

export async function upsertRegion(
  query: FilterQuery<IRegionModel>,
  update: UpdateQuery<IRegionModel>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return Region.findOneAndUpdate(query, update, options).exec();
}
