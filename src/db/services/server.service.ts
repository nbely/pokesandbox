import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery
} from "mongoose";
import Server, { IServer } from "../models/server.model";

export async function createServer(input: IServer) {
  const user: HydratedDocument<IServer> = new Server(input);
  return await user.save();
}

export async function deleteAllServers() {
  return Server.deleteMany({});
}

export async function findServer(
  query: FilterQuery<IServer>,
  options: QueryOptions = { lean: true }
) {
  return Server.findOne(query, null, options);
}

export async function upsertServer(
  query: FilterQuery<IServer>,
  update: UpdateQuery<IServer>,
  options: QueryOptions = { lean: true }
) {
  return Server.findOneAndUpdate(query, update, options);
}
