import {
  type HydratedDocument,
  type Model,
  model,
  models,
  type Query,
  type QueryFilter,
  Schema,
  Types,
} from 'mongoose';
import { z } from 'zod';

export const userEntitySchema = z.object({
  avatar: z.string().optional(),
  servers: z.array(z.instanceof(Types.ObjectId)),
  userId: z.string(),
  userTag: z.string(),
  username: z.string(),
});

export type IUser = z.infer<typeof userEntitySchema>;
export type User = HydratedDocument<IUser>;

interface IUserModel extends Model<IUser> {
  createUser(user: IUser): Promise<User>;
  upsertUser(
    filter: QueryFilter<IUser>,
    update: Partial<IUser>
  ): Query<User | null, IUser>;
}

export const userSchema = new Schema<IUser, IUserModel>(
  {
    avatar: String,
    servers: { type: [Schema.Types.ObjectId], ref: 'Server' },
    userId: { type: String, required: true },
    userTag: { type: String, required: true },
    username: { type: String, required: true },
  },
  {
    query: {
      byUserId(id: string) {
        return this.where({ userId: id });
      },
    },
    statics: {
      createUser(user: IUser) {
        const newUser = new this(user);
        return newUser.save();
      },
      upsertUser(filter: QueryFilter<IUser>, update: Partial<IUser>) {
        return this.findOneAndUpdate(filter, update, { upsert: true });
      },
    },
  }
);

export const User =
  (models.User as IUserModel) ||
  (model<IUser, IUserModel>('User', userSchema, 'users') as IUserModel);
