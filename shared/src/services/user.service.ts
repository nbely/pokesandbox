import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { User } from '../models/user.model';

export async function createUser(input: Omit<User, '_id'>) {
  const user: HydratedDocument<User> = new User(input);
  return await user.save();
}

export async function deleteAllUsers() {
  return User.deleteMany({}).exec();
}

export async function findAllUsers(
  options: QueryOptions = { lean: true }
): Promise<User[]> {
  return User.find({}, null, options).exec();
}

export async function findUser(
  query: FilterQuery<User>,
  options: QueryOptions = { lean: true }
) {
  return User.findOne(query, null, options).exec();
}

export async function upsertUser(
  query: FilterQuery<User>,
  update: UpdateQuery<User>,
  options: QueryOptions = { lean: true, upsert: true }
) {
  return User.findOneAndUpdate(query, update, options).exec();
}
