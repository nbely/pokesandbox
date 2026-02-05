import {
  type HydratedDocument,
  type Model,
  model,
  models,
  type Query,
  type QueryFilter,
  QueryWithHelpers,
  Schema,
  Types,
  UpdateQuery,
} from 'mongoose';
import { z } from 'zod';

export const userEntitySchema = z.object({
  avatarUrl: z.string().optional(),
  globalName: z.string(),
  servers: z.array(z.instanceof(Types.ObjectId)),
  userId: z.string(),
  username: z.string(),
});

export type IUser = z.infer<typeof userEntitySchema>;
export type User = HydratedDocument<IUser>;

// Define interface for query helpers
interface IUserQueryHelpers {
  byUserId(userId: string): QueryWithHelpers<any, User, IUserQueryHelpers>;
}

interface IUserModel extends Model<IUser, IUserQueryHelpers> {
  createUser(user: IUser): Promise<User>;
  upsertUser(
    filter: QueryFilter<IUser>,
    update: Partial<IUser>
  ): Query<User | null, IUser>;
}

export const userSchema = new Schema<
  IUser,
  IUserModel,
  Record<string, never>,
  IUserQueryHelpers
>(
  {
    avatarUrl: String,
    globalName: { type: String, required: true },
    servers: { type: [Schema.Types.ObjectId], ref: 'Server' },
    userId: { type: String, required: true },
    username: { type: String, required: true },
  },
  {
    query: {
      byUserId(
        this: QueryWithHelpers<any, User, IUserQueryHelpers>,
        userId: string
      ) {
        return this.where({ userId });
      },
    },
    statics: {
      createUser(user: IUser) {
        const newUser = new this(user);
        return newUser.save();
      },
      upsertUser(filter: QueryFilter<IUser>, update: Partial<IUser>) {
        const { servers, ...otherUpdates } = update;

        const updateOps: UpdateQuery<IUser> = { $set: otherUpdates };
        if (servers && servers.length > 0) {
          updateOps.$addToSet = { servers: { $each: servers } };
        }

        return this.findOneAndUpdate(filter, updateOps, {
          new: true,
          upsert: true,
        });
      },
    },
  }
);

export const User =
  (models.User as IUserModel) ||
  (model<IUser, IUserModel>('User', userSchema, 'users') as IUserModel);
