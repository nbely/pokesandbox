import {
  HydratedDocument,
  Model,
  Query,
  Schema,
  Types,
  model,
} from "mongoose";

export interface IServer {
	serverId: string,
  adminRoleIds?: string[],
  discovery: {
    description?: string,
    enabled: boolean,
    icon?: string,
    inviteLink?: string,
  },
  modRoleIds?: string[],
  name: string,
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
  discovery: { type: {
    description: {type: String, required: false },
    enabled: {type: Boolean, required: true },
    icon: {type: String, required: false },
    inviteLink: {type: String, required: false },
  }, required: true },
  modRoleIds: { type: [String], required: false },
  name: { type: String, required: true },
  playerList: { type: [Schema.Types.ObjectId], ref: 'User' },
  prefixes: { type: [String], required: false },
  regions: { type: [Schema.Types.ObjectId], ref: 'Region' }
});

const ServerModel = model<IServer, ServerModelType>('Server', ServerSchema, 'servers');

export default ServerModel;
