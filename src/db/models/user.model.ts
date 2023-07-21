import { HydratedDocument, Model, model, Query, Schema } from "mongoose";

export interface IUser {
  avatar?: string;
  userId: string;
  userTag: string;
  username: string;
}

type UserModelType = Model<IUser, UserQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type UserModelQuery = Query<any, HydratedDocument<IUser>, UserQueryHelpers> &
  UserQueryHelpers;
interface UserQueryHelpers {
  byUserId(this: UserModelQuery, userId: string): UserModelQuery;
}

export const UserSchema: Schema = new Schema({
  avatar: { type: String, required: false },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  username: { type: String, required: true },
});

const UserModel = model<IUser, UserModelType>("User", UserSchema, "users");

export default UserModel;
