import { HydratedDocument, Model, model, Query, Schema, Types } from "mongoose";

export interface IServer {
	serverId: string,
  description?: string,
  discoveryEnabled?: boolean,
  icon?: string,
  name: string,
  permanentInviteLink?: string,
  playerList: Types.ObjectId[],
  prefixes?: string[],
}

type ServerModelType = Model<IServer, ServerQueryHelpers>;
type ServerModelQuery = Query<any, HydratedDocument<IServer>, ServerQueryHelpers> & ServerQueryHelpers;
interface ServerQueryHelpers {
	byServerId(this: ServerModelQuery, serverId: string): ServerModelQuery;
}

export const ServerSchema: Schema = new Schema({
	serverId: { type: String, required: true },
  description: {type: String, required: false },
  discoveryEnabled: {type: Boolean, required: false},
  icon: { type: String, required: false },
  name: { type: String, required: true },
  permanentInviteLink: { type: String, required: false },
  playerList: { type: [Schema.Types.ObjectId], ref: 'User' },
  prefixes: { type: [String], required: false },
});

const ServerModel = model<IServer, ServerModelType>('Server', ServerSchema, 'servers');

export default ServerModel;
