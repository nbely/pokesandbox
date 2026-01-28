import {
  type HydratedDocument,
  type Model,
  model,
  models,
  type Query,
  type QueryFilter,
  type QueryWithHelpers,
  Schema,
  Types,
} from 'mongoose';
import { z } from 'zod';
import { Region } from './region.model';

export const serverEntitySchema = z.object({
  serverId: z.string(),
  adminRoleIds: z.array(z.string()),
  discovery: z.object({
    description: z.string().optional(),
    enabled: z.boolean(),
    icon: z.string().optional(),
    inviteLink: z.string().optional(),
  }),
  modRoleIds: z.array(z.string()),
  name: z.string(),
  playerList: z.array(z.instanceof(Types.ObjectId)),
  prefixes: z.array(z.string()),
  regions: z.array(z.instanceof(Types.ObjectId)),
});

export type IServer = z.infer<typeof serverEntitySchema>;
export type Server = HydratedDocument<IServer>;

// Define interface for query helpers
interface IServerQueryHelpers {
  byServerId(
    serverId?: string
  ): QueryWithHelpers<any, Server, IServerQueryHelpers>;
}

interface IServerModel extends Model<IServer, IServerQueryHelpers> {
  createServer(server: IServer): Promise<Server>;
  findServerWithRegions(
    filter: QueryFilter<IServer>
  ): Query<(Omit<Server, 'regions'> & { regions: Region[] }) | null, IServer>;
  upsertServer(
    filter: QueryFilter<IServer>,
    update: Partial<IServer>
  ): Query<Server | null, IServer>;
}

export const serverSchema = new Schema<
  IServer,
  IServerModel,
  Record<string, never>,
  IServerQueryHelpers
>(
  {
    serverId: { type: String, required: true },
    adminRoleIds: { type: [String], required: true },
    discovery: {
      type: {
        description: String,
        enabled: { type: Boolean, required: true },
        icon: String,
        inviteLink: String,
      },
      required: true,
    },
    modRoleIds: { type: [String], required: true },
    name: { type: String, required: true },
    playerList: { type: [Schema.Types.ObjectId], ref: 'User', required: true },
    prefixes: { type: [String], required: true },
    regions: { type: [Schema.Types.ObjectId], ref: 'Region', required: true },
  },
  {
    query: {
      byServerId(
        this: QueryWithHelpers<any, Server, IServerQueryHelpers>,
        serverId?: string
      ) {
        return this.where({ serverId });
      },
    },
    statics: {
      createServer(server: IServer) {
        const newServer = new this(server);
        return newServer.save();
      },
      findServerWithRegions(filter: QueryFilter<IServer>) {
        return this.findOne(filter).populate('regions');
      },
      upsertServer(filter: QueryFilter<IServer>, update: Partial<IServer>) {
        return this.findOneAndUpdate(filter, update, { upsert: true });
      },
    },
  }
);

export const Server =
  (models.Server as IServerModel) ||
  (model<IServer, IServerModel>(
    'Server',
    serverSchema,
    'servers'
  ) as IServerModel);
