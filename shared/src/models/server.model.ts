import { HydratedDocument, Model, Query, Schema, Types, model } from 'mongoose';
import { z } from 'zod';

export const serverEntitySchema = z.object({
  _id: z.instanceof(Types.ObjectId),
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

export type ServerEntity = z.infer<typeof serverEntitySchema>;

export type Server = HydratedDocument<ServerEntity>;

type ServerModelType = Model<ServerEntity, ServerQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type ServerModelQuery = Query<
  any,
  HydratedDocument<ServerEntity>,
  ServerQueryHelpers
> &
  ServerQueryHelpers;

export interface ServerQueryHelpers {
  byServerId(this: ServerModelQuery, serverId: string): ServerModelQuery;
}

export const ServerSchema: Schema = new Schema({
  serverId: { type: String, required: true },
  adminRoleIds: { type: [String], required: true },
  discovery: {
    type: {
      description: { type: String, required: false },
      enabled: { type: Boolean, required: true },
      icon: { type: String, required: false },
      inviteLink: { type: String, required: false },
    },
    required: true,
  },
  modRoleIds: { type: [String], required: true },
  name: { type: String, required: true },
  playerList: { type: [Schema.Types.ObjectId], ref: 'User', required: true },
  prefixes: { type: [String], required: true },
  regions: { type: [Schema.Types.ObjectId], ref: 'Region', required: true },
});

export const Server = model<ServerEntity, ServerModelType>(
  'Server',
  ServerSchema,
  'servers',
);
