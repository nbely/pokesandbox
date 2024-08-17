import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import Server, { IServerModel } from "../models/server.model";

export async function createServer(input: IServerModel) {
  const user: HydratedDocument<IServerModel> = new Server(input);
  return await user.save();
}

export async function deleteAllServers() {
  return Server.deleteMany({}).exec();
}

export async function findServer(
  query: FilterQuery<IServerModel>,
  options: QueryOptions = { lean: true },
) {
  return Server.findOne(query, null, options).exec();
}

export async function findServerAndPopulateRegions(
  query: FilterQuery<IServerModel>,
  options: QueryOptions = { lean: true },
) {
  return Server.findOne(query, null, options).populate("regions").exec();
}

export async function upsertServer(
  query: FilterQuery<IServerModel>,
  update: UpdateQuery<IServerModel>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return Server.findOneAndUpdate(query, update, options).exec();
}
