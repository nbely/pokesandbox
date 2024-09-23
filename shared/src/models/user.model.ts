import { HydratedDocument, Model, Query, Schema, Types, model } from 'mongoose';
import { z } from 'zod';

export const userEntitySchema = z.object({
  _id: z.instanceof(Types.ObjectId),
  avatar: z.string().optional(),
  servers: z.array(z.instanceof(Types.ObjectId)),
  userId: z.string(),
  userTag: z.string(),
  username: z.string(),
});

export type UserEntity = z.infer<typeof userEntitySchema>;

export type User = HydratedDocument<UserEntity>;

type UserModelType = Model<UserEntity, UserQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type UserModelQuery = Query<
  any,
  HydratedDocument<UserEntity>,
  UserQueryHelpers
> &
  UserQueryHelpers;

export interface UserQueryHelpers {
  byUserId(this: UserModelQuery, userId: string): UserModelQuery;
}

export const UserSchema: Schema = new Schema({
  avatar: { type: String, required: false },
  servers: { type: [Schema.Types.ObjectId], ref: 'Server' },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  username: { type: String, required: true },
});

export const User = model<UserEntity, UserModelType>('User', UserSchema, 'users');
