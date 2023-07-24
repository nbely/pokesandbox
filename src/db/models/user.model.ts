import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

import type { IServer } from "./server.model";

export interface IUserModel {
  avatar?: string;
  servers: Types.ObjectId[];
  userId: string;
  userTag: string;
  username: string;
}

export interface IUser extends IUserModel {
  _id: Types.ObjectId;
}

export interface IUserPopulated extends Omit<IUser, "servers"> {
  servers: IServer[];
}

type UserModelType = Model<IUserModel, UserQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type UserModelQuery = Query<
  any,
  HydratedDocument<IUserModel>,
  UserQueryHelpers
> &
  UserQueryHelpers;
interface UserQueryHelpers {
  byUserId(this: UserModelQuery, userId: string): UserModelQuery;
}

export const UserSchema: Schema = new Schema({
  avatar: { type: String, required: false },
  servers: { type: [Schema.Types.ObjectId], ref: "Server" },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  username: { type: String, required: true },
});

const UserModel = model<IUserModel, UserModelType>("User", UserSchema, "users");

export default UserModel;
