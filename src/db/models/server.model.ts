import { HydratedDocument, Model, model, Query, Schema } from "mongoose";

export interface IServer {
  avatar?: string,
  prefixes?: string[],
	serverId: string,
}

type ServerModelType = Model<IServer, ServerQueryHelpers>;
type ServerModelQuery = Query<any, HydratedDocument<IServer>, ServerQueryHelpers> & ServerQueryHelpers;
interface ServerQueryHelpers {
	byServerId(this: ServerModelQuery, serverId: string): ServerModelQuery;
} 

export const ServerSchema: Schema = new Schema({
  avatar: { type: String, required: false },
	serverId: { type: String, required: true },
});

const ServerModel = model<IServer, ServerModelType>('Server', ServerSchema, 'servers');

export default ServerModel;
