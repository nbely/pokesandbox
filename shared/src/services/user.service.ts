import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { User, UserEntity } from '../models/user.model';

export async function createUser(input: Omit<UserEntity, '_id'>) {
  const user: HydratedDocument<UserEntity> = new User(input);
  return await user.save();
}

export async function deleteAllUsers() {
  return User.deleteMany({}).exec();
}

export async function findUser(
  query: FilterQuery<UserEntity>,
  options: QueryOptions = { lean: true },
) {
  return User.findOne(query, null, options).exec();
}

export async function upsertUser(
  query: FilterQuery<UserEntity>,
  update: UpdateQuery<UserEntity>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return User.findOneAndUpdate(query, update, options).exec();
}
