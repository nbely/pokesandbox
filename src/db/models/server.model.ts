import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

import type { IRegion } from "./region.model";
import type { IUser } from "./user.model";

export interface IServerModel {
  serverId: string;
  adminRoleIds: string[];
  discovery: {
    description?: string;
    enabled: boolean;
    icon?: string;
    inviteLink?: string;
  };
  modRoleIds: string[];
  name: string;
  playerList: Types.ObjectId[];
  prefixes: string[];
  regions: Types.ObjectId[];
}

export interface IServer extends IServerModel {
  _id: Types.ObjectId;
}

export interface IServerPopulated
  extends Omit<IServer, "playerList" | "regions"> {
  playerList: IUser[];
  regions: IRegion[];
}

type ServerModelType = Model<IServerModel, ServerQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type ServerModelQuery = Query<
  any,
  HydratedDocument<IServerModel>,
  ServerQueryHelpers
> &
  ServerQueryHelpers;
interface ServerQueryHelpers {
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
  playerList: { type: [Schema.Types.ObjectId], ref: "User", required: true },
  prefixes: { type: [String], required: true },
  regions: { type: [Schema.Types.ObjectId], ref: "Region", required: true },
});

const ServerModel = model<IServer, ServerModelType>(
  "Server",
  ServerSchema,
  "servers"
);

export default ServerModel;
