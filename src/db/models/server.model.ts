import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

export interface IServer {
	serverId: string,
  adminRoleIds?: string[],
  description?: string,
  discoveryEnabled?: boolean,
  icon?: string,
  inviteLink?: string,
  modRoleIds?: string[],
  name: string,
  permanentInviteLink?: string,
  playerList: Types.ObjectId[],
  prefixes?: string[],
  regions?: Types.ObjectId[],
}

type ServerModelType = Model<IServer, ServerQueryHelpers>;
type ServerModelQuery = Query<any, HydratedDocument<IServer>, ServerQueryHelpers> & ServerQueryHelpers;
interface ServerQueryHelpers {
	byServerId(this: ServerModelQuery, serverId: string): ServerModelQuery;
}

export const ServerSchema: Schema = new Schema({
	serverId: { type: String, required: true },
  adminRoleIds: { type: [String], required: false },
  description: {type: String, required: false },
  discoveryEnabled: {type: Boolean, required: false},
  icon: { type: String, required: false },
  inviteLink: { type: String, required: false },
  modRoleIds: { type: [String], required: false },
  name: { type: String, required: true },
  permanentInviteLink: { type: String, required: false },
  playerList: { type: [Schema.Types.ObjectId], ref: 'User' },
  prefixes: { type: [String], required: false },
  regions: { type: [Schema.Types.ObjectId], ref: 'User' }
});

const ServerModel = model<IServer, ServerModelType>('Server', ServerSchema, 'servers');

export default ServerModel;
