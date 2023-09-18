import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

import type { IUser } from "./user.model";

export interface IRegionModel {
  baseGeneration: number;
  charactersPerPlayer: number;
  characterList: Types.ObjectId[];
  currencyType: string;
  deployable: boolean;
  deployed: boolean;
  graphicSettings: {
    backSpritesEnabled?: boolean;
    frontSpritesEnabled?: boolean;
    iconSpritesEnabled?: boolean;
    mapImageLink?: string;
  };
  locations: Types.ObjectId[];
  name: string;
  playerList: Types.ObjectId[];
  pokedex: {
    id: Types.ObjectId,
    name: string,
  }[];
  progressionTypes: {
    [key: string]: string[] | number;
  };
  quests: {
    active: Types.ObjectId[];
    passive: Types.ObjectId[];
    maxPassiveQuests?: number;
  };
  shops: Types.ObjectId[];
  transportationTypes: string[];
}

export interface IRegion extends IRegionModel {
  _id: Types.ObjectId;
}

export interface IRegionPopulated
  extends Omit<
    IRegion,
    | "characterList"
    | "locations"
    | "playerList"
    | "pokedex"
    | "quests"
    | "shops"
  > {
  characterList: string[]; // ICharacter[];
  locations: string[]; // ILocation[];
  playerList: IUser[];
  pokedex: {
    id: string; // IDexEntry[];
    name: string;
  }[];
  quests: {
    active: string[]; // IQuest[];
    passive: string[]; // IQuest[];
    maxPassiveQuests?: number;
  };
  shops: string[]; // IShop[];
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
  baseGeneration: { type: Number, required: true },
  charactersPerPlayer: { type: Number, required: true },
  characterList: { type: [Schema.Types.ObjectId], ref: "Character" },
  currencyType: { type: String, required: true },
  deployable: { type: Boolean, required: true },
  deployed: { type: Boolean, required: true },
  graphicSettings: {
    type: {
      backSpritesEnabled: { type: String, required: false },
      frontSpritesEnabled: { type: Boolean, required: false },
      iconSpritesEnabled: { type: String, required: false },
      mapImageLink: { type: String, required: false },
    },
    required: true,
  },
  locations: { type: [Schema.Types.ObjectId], ref: "Location", required: true },
  name: { type: String, required: true },
  playerList: { type: [Schema.Types.ObjectId], ref: "User", required: true },
  pokedex: {
    type: {
      id: { type: [Schema.Types.ObjectId], ref: "DexEntry", required: true },
      name: { type: String, required: true },
    },
    required: true,
  },
  progressionTypes: {
    type: Map,
    of: Schema.Types.Mixed,
    required: true,
  },
  quests: {
    type: {
      active: { type: [Schema.Types.ObjectId], ref: "Quest", required: true },
      passive: { type: [Schema.Types.ObjectId], ref: "Quest", required: true },
      maxPassiveQuests: { type: Number, required: false },
    },
    required: true,
  },
  shops: { type: [Schema.Types.ObjectId], ref: "Shop", required: true },
  transportationTypes: { type: [String], required: true },
});

const RegionModel = model<IRegionModel, RegionModelType>(
  "Region",
  RegionSchema,
  "regions",
);

export default RegionModel;
