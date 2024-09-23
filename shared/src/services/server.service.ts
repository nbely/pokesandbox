import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import  { Server, ServerEntity } from "../models/server.model";

export async function createServer(input: Omit<ServerEntity, '_id'>) {
  const user: HydratedDocument<ServerEntity> = new Server(input);
  return await user.save();
}

export async function deleteAllServers() {
  return Server.deleteMany({}).exec();
}

export async function findServer(
  query: FilterQuery<ServerEntity>,
  options: QueryOptions = { lean: true },
) {
  return Server.findOne(query, null, options).exec();
}

export async function findServerAndPopulateRegions(
  query: FilterQuery<ServerEntity>,
  options: QueryOptions = { lean: true },
) {
  return Server.findOne(query, null, options).populate("regions").exec();
}

export async function upsertServer(
  query: FilterQuery<ServerEntity>,
  update: UpdateQuery<ServerEntity>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return Server.findOneAndUpdate(query, update, options).exec();
}
