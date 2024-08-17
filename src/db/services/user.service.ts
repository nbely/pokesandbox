import {
  FilterQuery,
  HydratedDocument,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import User, { IUserModel } from "../models/user.model";

export async function createUser(input: IUserModel) {
  const user: HydratedDocument<IUserModel> = new User(input);
  return await user.save();
}

export async function deleteAllUsers() {
  return User.deleteMany({}).exec();
}

export async function findUser(
  query: FilterQuery<IUserModel>,
  options: QueryOptions = { lean: true },
) {
  return User.findOne(query, null, options).exec();
}

export async function upsertUser(
  query: FilterQuery<IUserModel>,
  update: UpdateQuery<IUserModel>,
  options: QueryOptions = { lean: true, upsert: true },
) {
  return User.findOneAndUpdate(query, update, options).exec();
}
