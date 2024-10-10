import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Server } from '../models/server.model';

export async function createServer(input: Omit<Server, '_id'>) {
  const user: HydratedDocument<Server> = new Server(input);
  return await user.save();
}

export async function deleteAllServers() {
  return Server.deleteMany({}).exec();
}

export async function findAllServers(options: QueryOptions = { lean: true }) {
  return Server.find({}, null, options).exec();
}

export async function findServer(
  query: FilterQuery<Server>,
  options: QueryOptions = { lean: true }
) {
  return Server.findOne(query, null, options).exec();
}

export async function findServerAndPopulateRegions(
  query: FilterQuery<Server>,
  options: QueryOptions = { lean: true }
) {
  return Server.findOne(query, null, options).populate('regions').exec();
}

export async function upsertServer(
  query: FilterQuery<Server>,
  update: UpdateQuery<Server>,
  options: QueryOptions = { lean: true, upsert: true }
) {
  return Server.findOneAndUpdate(query, update, options).exec();
}
