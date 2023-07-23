import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

import type { IUser } from "./user.model";

export interface IRegionModel {
  name: string;
  playerList: Types.ObjectId[];
}

export interface IRegion extends IRegionModel {
  _id: Types.ObjectId;
}

export interface IRegionPopulated {
  _id: Types.ObjectId;
  name: string;
  playerList: Types.ObjectId[] | IUser[];
}

type RegionModelType = Model<IRegionModel, RegionQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type RegionModelQuery = Query<
  any,
  HydratedDocument<IRegionModel>,
  RegionQueryHelpers
> &
  RegionQueryHelpers;
interface RegionQueryHelpers {
  byRegionId(this: RegionModelQuery, serverId: string): RegionModelQuery;
}

export const RegionSchema: Schema = new Schema({
  name: { type: String, required: true },
  playerList: { type: [Schema.Types.ObjectId], ref: "User" },
});

const RegionModel = model<IRegionModel, RegionModelType>(
  "Region",
  RegionSchema,
  "regions",
);

export default RegionModel;
