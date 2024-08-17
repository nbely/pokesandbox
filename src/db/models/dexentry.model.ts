import { HydratedDocument, Model, Query, Schema, Types, model } from "mongoose";

export type EvoRegion = "Alola" | "Galar";
export type EvoType =
  | "trade"
  | "useItem"
  | "levelMove"
  | "levelExtra"
  | "levelFriendship"
  | "levelHold"
  | "other";
export type GenderName = "" | "M" | "F" | "N";
export type GenderRatio = { M: number; F: number };
export type SpeciesAbility = {
  0: string;
  1?: string;
  H?: string;
  S?: string;
};
export type SpeciesTag =
  | "Mythical"
  | "Restricted Legendary"
  | "Sub-Legendary"
  | "Paradox";
export type StatsTable = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};
export type SinglesTier =
  | "AG"
  | "Uber"
  | "(Uber)"
  | "OU"
  | "(OU)"
  | "UUBL"
  | "UU"
  | "RUBL"
  | "RU"
  | "NUBL"
  | "NU"
  | "(NU)"
  | "PUBL"
  | "PU"
  | "(PU)"
  | "NFE"
  | "LC";
export type DoublesTier =
  | "DUber"
  | "(DUber)"
  | "DOU"
  | "(DOU)"
  | "DBL"
  | "DUU"
  | "(DUU)"
  | "NFE"
  | "LC";
export type OtherTier = "Unreleased" | "Illegal" | "CAP" | "CAP NFE" | "CAP LC";
export type Sprites = {
  back?: string;
  backf?: string;
  front: string;
  frontf?: string;
  icon?: string;
};
export type Gen1Sprite = {
  normal: Sprites;
  gray?: Sprites;
  color?: Sprites;
};
export type Sprite = {
  normal: Sprites;
  shiny?: Sprites;
};
export enum Gen1 {
  "rb" = "rb",
  "rg" = "rg",
  "y" = "y",
}
export enum Gen2 {
  "c" = "c",
  "g" = "g",
  "s" = "s",
}
export enum Gen3 {
  "e" = "e",
  "frlg" = "frlg",
  "rs" = "rs",
}
export enum Gen4 {
  "dp" = "dp",
  "hgss" = "hgss",
  "p" = "p",
}
export enum Gen5 {
  "bw" = "bw",
}
export enum Gen6 {
  "bank" = "bank",
  "go" = "go",
  "oras" = "oras",
  "xy" = "xy",
}
export enum Gen7 {
  "lgpe" = "lgpe",
}
export enum Gen8 {
  "bdsp" = "bdsp",
  "home" = "home",
  "la" = "la",
  "swsh" = "swsh",
}
export enum Gen9 {
  "sv" = "sv",
}
export enum OtherSpriteGroup {
  "sugimori" = "sugimori",
  "custom" = "custom",
}
export interface ISprites {
  footprint?: string;
  g1?: {
    [value in Gen1]?: Gen1Sprite;
  };
  g2?: {
    [value in Gen2]?: Sprite;
  };
  g3?: {
    [value in Gen3]?: Sprite;
  };
  g4?: {
    [value in Gen4]?: Sprite;
  };
  g5?: {
    [value in Gen5]?: Sprite;
  };
  g6?: {
    [value in Gen6]?: Sprite;
  };
  g7?: {
    [value in Gen7]?: Sprite;
  };
  g8?: {
    [value in Gen8]?: Sprite;
  };
  g9?: {
    [value in Gen9]?: Sprite;
  };
  other?: {
    [value in OtherSpriteGroup]?: Sprite;
  };
  shape?: string;
}

export interface IShowdownDexEntry {
  num: number;
  name: string;
  baseForme?: string;
  baseSpecies?: string;
  forme?: string;
  types: string[];
  gender?: GenderName;
  genderRatio?: GenderRatio;
  baseStats: StatsTable;
  maxHP?: number;
  abilities: SpeciesAbility;
  heightm: number;
  weightkg: number;
  color: string;
  prevo?: string;
  evoLevel?: number;
  evoType?: EvoType;
  evoMove?: string;
  evoItem?: string;
  evoRegion?: EvoRegion;
  evoCondition?: string;
  evos?: string[];
  nfe?: boolean;
  eggGroups: string[];
  canHatch?: boolean;
  otherFormes?: string[];
  cosmeticFormes?: string[];
  formeOrder?: string[];
  requiredAbility?: string;
  battleOnly?: string | string[];
  requiredItem?: string;
  requiredItems?: string[];
  requiredMove?: string;
  cannotDynamax?: boolean;
  canGigantamax?: string;
  gmaxUnreleased?: boolean;
  changesFrom?: string;
  tags?: SpeciesTag[];
  maleOnlyHidden?: boolean;
  unreleasedHidden?: boolean | "Past";
  pokemonGoData?: string[];
  gen?: number;
  tier?: SinglesTier | OtherTier;
  doublesTier?: DoublesTier | OtherTier;
  natDexTier?: SinglesTier | OtherTier;
}

export interface IDexEntryModel
  extends Omit<
    IShowdownDexEntry,
    | "baseSpecies"
    | "changesFrom"
    | "cosmeticFormes"
    | "evoRegion"
    | "evos"
    | "formeOrder"
    | "otherFormes"
    | "prevo"
  > {
  baseSpecies?: {
    id: Types.ObjectId;
    name: string;
  };
  baseHappiness: number;
  baseStatTotal: number;
  catchRate: number;
  changesFrom?: {
    id: Types.ObjectId;
    name: string;
  };
  cosmeticFormes?: {
    id: Types.ObjectId;
    name: string;
  }[];
  classification: string;
  dexEntries?: string[];
  evYields: StatsTable;
  evoRegion?:
    | {
        id?: Types.ObjectId;
        name: string;
      }
    | string;
  evos?: {
    id: Types.ObjectId;
    name: string;
  }[];
  expGrowth: string;
  expYield: number;
  formeOrder?: {
    id: Types.ObjectId;
    name: string;
  }[];
  hatchCycles: number;
  heightIn: number;
  isCanon?: boolean;
  isPublic?: boolean;
  originServer?: Types.ObjectId;
  otherFormes?: {
    id: Types.ObjectId;
    name: string;
  }[];
  prevo?: {
    id: Types.ObjectId;
    name: string;
  };
  showdownName: string;
  sprites: ISprites;
  weightLb: number;
}

export interface IDexEntry extends IDexEntryModel {
  _id: Types.ObjectId;
}

type DexEntryModelType = Model<IDexEntryModel, DexEntryQueryHelpers>;
/* eslint-disable @typescript-eslint/no-explicit-any */
type DexEntryModelQuery = Query<
  any,
  HydratedDocument<IDexEntryModel>,
  DexEntryQueryHelpers
> &
  DexEntryQueryHelpers;
interface DexEntryQueryHelpers {
  byDexEntryId(this: DexEntryModelQuery, serverId: string): DexEntryModelQuery;
}

export const DexEntrySchema: Schema = new Schema({
  abilities: {
    type: {
      0: { type: String, required: true },
      1: { type: String, required: false },
      H: { type: String, required: false },
      S: { type: String, required: false },
    },
    required: true,
  },
  baseForme: { type: String, required: false },
  baseHappiness: { type: Number, required: true },
  baseSpecies: {
    type: {
      id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
      name: { type: String, required: false },
    },
    required: false,
  },
  baseStatTotal: { type: Number, required: true },
  baseStats: {
    type: {
      hp: { type: Number, required: true },
      atk: { type: Number, required: true },
      def: { type: Number, required: true },
      spa: { type: Number, required: true },
      spd: { type: Number, required: true },
      spe: { type: Number, required: true },
    },
    required: true,
  },
  battleOnly: { type: Schema.Types.Mixed, required: false },
  canGigantamax: { type: String, required: false },
  canHatch: { type: Boolean, required: false },
  cannotDynamax: { type: Boolean, required: false },
  catchRate: { type: Number, required: true },
  changesFrom: {
    type: {
      id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
      name: { type: String, required: false },
    },
    required: false,
  },
  classification: { type: String, required: true },
  color: { type: String, required: true },
  cosmeticFormes: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
        name: { type: String, required: false },
      },
    ],
    required: false,
  },
  dexEntries: { type: [String], required: false },
  doublesTier: { type: String, required: false },
  eggGroups: { type: [String], required: true },
  evYields: {
    type: {
      hp: { type: Number, required: true },
      atk: { type: Number, required: true },
      def: { type: Number, required: true },
      spa: { type: Number, required: true },
      spd: { type: Number, required: true },
      spe: { type: Number, required: true },
    },
    required: true,
  },
  evoCondition: { type: String, required: false },
  evoItem: { type: String, required: false },
  evoLevel: { type: Number, required: false },
  evoMove: { type: String, required: false },
  evoRegion: {
    type: {
      id: { type: Schema.Types.ObjectId, ref: "Region", required: false },
      name: { type: String, required: false },
    },
    required: false,
  },
  evoType: { type: String, required: false },
  evos: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
        name: { type: String, required: false },
      },
    ],
    required: false,
  },
  expGrowth: { type: String, required: true },
  expYield: { type: Number, required: true },
  forme: { type: String, required: false },
  formeOrder: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
        name: { type: String, required: false },
      },
    ],
    required: false,
  },
  gen: { type: Number, required: false },
  gender: { type: String, required: false },
  genderRatio: {
    type: {
      M: { type: Number, required: false },
      F: { type: Number, required: false },
    },
    required: false,
  },
  gmaxUnreleased: { type: Boolean, required: false },
  hatchCycles: { type: Number, required: true },
  heightIn: { type: Number, required: true },
  heightm: { type: Number, required: true },
  isCanon: { type: Boolean, required: false },
  isPublic: { type: Boolean, required: false },
  maleOnlyHidden: { type: Boolean, required: false },
  maxHP: { type: Number, required: false },
  name: { type: String, required: true },
  natDexTier: { type: String, required: false },
  nfe: { type: Boolean, required: false },
  num: { type: Number, required: true },
  originServer: { type: Schema.Types.ObjectId, ref: "Server", required: false },
  otherFormes: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
        name: { type: String, required: false },
      },
    ],
    required: false,
  },
  pokemonGoData: { type: [String], required: false },
  prevo: {
    type: {
      id: { type: Schema.Types.ObjectId, ref: "DexEntry", required: false },
      name: { type: String, required: false },
    },
    required: false,
  },
  requiredAbility: { type: String, required: false },
  requiredItem: { type: String, required: false },
  requiredItems: { type: [String], required: false },
  requiredMove: { type: String, required: false },
  showdownName: { type: String, required: true },
  sprites: {
    type: {
      footprint: { type: String, required: false },
      g1: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          gray: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          color: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g2: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g3: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g4: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g5: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g6: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g7: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g8: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      g9: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      other: {
        type: Map,
        of: {
          normal: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
          shiny: {
            type: {
              back: { type: String, required: false },
              backf: { type: String, required: false },
              front: { type: String, required: false },
              frontf: { type: String, required: false },
              icon: { type: String, required: false },
            },
            required: false,
          },
        },
        required: false,
      },
      shape: { type: String, required: false },
    },
    required: false,
  },
  tags: { type: [String], required: false },
  tier: { type: String, required: false },
  types: { type: [String], required: true },
  unreleasedHidden: { type: Schema.Types.Mixed, required: false },
  weightLb: { type: Number, required: true },
  weightkg: { type: Number, required: true },
});

const DexEntryModel = model<IDexEntryModel, DexEntryModelType>(
  "DexEntry",
  DexEntrySchema,
  "dexentries"
);

export default DexEntryModel;
