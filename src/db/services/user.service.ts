import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import User, { IUser } from "../models/user.model";

export async function createUser(input: IUser) {
  const user: HydratedDocument<IUser> = new User(input);
  return await user.save();
}

export async function deleteAllUsers() {
  return User.deleteMany({});
}

export async function findUser(
  query: FilterQuery<IUser>,
  options: QueryOptions = { lean: true },
) {
  return User.findOne(query, null, options);
}

export async function upsertUser(
  query: FilterQuery<IUser>,
  update: UpdateQuery<IUser>,
  options: QueryOptions = { lean: true },
) {
  return User.findOneAndUpdate(query, update, options);
}
