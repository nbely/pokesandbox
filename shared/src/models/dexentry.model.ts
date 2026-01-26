import {
  type HydratedDocument,
  type Model,
  model,
  type Query,
  type QueryFilter,
  Schema,
  Types,
} from 'mongoose';

export type EvoRegion = 'Alola' | 'Galar';
export type EvoType =
  | 'trade'
  | 'useItem'
  | 'levelMove'
  | 'levelExtra'
  | 'levelFriendship'
  | 'levelHold'
  | 'other';
export type GenderName = '' | 'M' | 'F' | 'N';
export type GenderRatio = { M: number; F: number };
export type SpeciesAbility = {
  0: string;
  1?: string;
  H?: string;
  S?: string;
};
export type SpeciesTag =
  | 'Mythical'
  | 'Restricted Legendary'
  | 'Sub-Legendary'
  | 'Paradox';
export type StatsTable = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};
export type SinglesTier =
  | 'AG'
  | 'Uber'
  | '(Uber)'
  | 'OU'
  | '(OU)'
  | 'UUBL'
  | 'UU'
  | 'RUBL'
  | 'RU'
  | 'NUBL'
  | 'NU'
  | '(NU)'
  | 'PUBL'
  | 'PU'
  | '(PU)'
  | 'NFE'
  | 'LC';
export type DoublesTier =
  | 'DUber'
  | '(DUber)'
  | 'DOU'
  | '(DOU)'
  | 'DBL'
  | 'DUU'
  | '(DUU)'
  | 'NFE'
  | 'LC';
export type OtherTier = 'Unreleased' | 'Illegal' | 'CAP' | 'CAP NFE' | 'CAP LC';
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
  'rb' = 'rb',
  'rg' = 'rg',
  'y' = 'y',
}
export enum Gen2 {
  'c' = 'c',
  'g' = 'g',
  's' = 's',
}
export enum Gen3 {
  'e' = 'e',
  'frlg' = 'frlg',
  'rs' = 'rs',
}
export enum Gen4 {
  'dp' = 'dp',
  'hgss' = 'hgss',
  'p' = 'p',
}
export enum Gen5 {
  'bw' = 'bw',
}
export enum Gen6 {
  'bank' = 'bank',
  'go' = 'go',
  'oras' = 'oras',
  'xy' = 'xy',
}
export enum Gen7 {
  'lgpe' = 'lgpe',
}
export enum Gen8 {
  'bdsp' = 'bdsp',
  'home' = 'home',
  'la' = 'la',
  'swsh' = 'swsh',
}
export enum Gen9 {
  'sv' = 'sv',
}
export enum OtherSpriteGroup {
  'sugimori' = 'sugimori',
  'custom' = 'custom',
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
  unreleasedHidden?: boolean | 'Past';
  pokemonGoData?: string[];
  gen?: number;
  tier?: SinglesTier | OtherTier;
  doublesTier?: DoublesTier | OtherTier;
  natDexTier?: SinglesTier | OtherTier;
}

export interface IDexEntry
  extends Omit<
    IShowdownDexEntry,
    | 'baseSpecies'
    | 'changesFrom'
    | 'cosmeticFormes'
    | 'evoRegion'
    | 'evos'
    | 'formeOrder'
    | 'otherFormes'
    | 'prevo'
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

export type DexEntry = HydratedDocument<IDexEntry>;

interface IDexEntryModel extends Model<IDexEntry> {
  createDexEntry(dexEntry: IDexEntry): Promise<DexEntry>;
  upsertDexEntry(
    filter: QueryFilter<IDexEntry>,
    update: Partial<IDexEntry>
  ): Query<DexEntry | null, IDexEntry>;
}

export const DexEntrySchema = new Schema<IDexEntry, IDexEntryModel>(
  {
    abilities: {
      type: {
        0: { type: String, required: true },
        1: String,
        H: String,
        S: String,
      },
      required: true,
    },
    baseForme: String,
    baseHappiness: { type: Number, required: true },
    baseSpecies: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
        name: String,
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
    canGigantamax: String,
    canHatch: { type: Boolean, required: false },
    cannotDynamax: { type: Boolean, required: false },
    catchRate: { type: Number, required: true },
    changesFrom: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
        name: String,
      },
      required: false,
    },
    classification: { type: String, required: true },
    color: { type: String, required: true },
    cosmeticFormes: {
      type: [
        {
          id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
          name: String,
        },
      ],
      required: false,
    },
    dexEntries: { type: [String], required: false },
    doublesTier: String,
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
    evoCondition: String,
    evoItem: String,
    evoLevel: { type: Number, required: false },
    evoMove: String,
    evoRegion: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'Region', required: false },
        name: String,
      },
      required: false,
    },
    evoType: String,
    evos: {
      type: [
        {
          id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
          name: String,
        },
      ],
      required: false,
    },
    expGrowth: { type: String, required: true },
    expYield: { type: Number, required: true },
    forme: String,
    formeOrder: {
      type: [
        {
          id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
          name: String,
        },
      ],
      required: false,
    },
    gen: { type: Number, required: false },
    gender: String,
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
    natDexTier: String,
    nfe: { type: Boolean, required: false },
    num: { type: Number, required: true },
    originServer: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: false,
    },
    otherFormes: {
      type: [
        {
          id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
          name: String,
        },
      ],
      required: false,
    },
    pokemonGoData: { type: [String], required: false },
    prevo: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: 'DexEntry', required: false },
        name: String,
      },
      required: false,
    },
    requiredAbility: String,
    requiredItem: String,
    requiredItems: { type: [String], required: false },
    requiredMove: String,
    showdownName: { type: String, required: true },
    sprites: {
      type: {
        footprint: String,
        g1: {
          type: Map,
          of: {
            normal: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            gray: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            color: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
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
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
            shiny: {
              type: {
                back: String,
                backf: String,
                front: String,
                frontf: String,
                icon: String,
              },
              required: false,
            },
          },
          required: false,
        },
        shape: String,
      },
      required: false,
    },
    tags: { type: [String], required: false },
    tier: String,
    types: { type: [String], required: true },
    unreleasedHidden: { type: Schema.Types.Mixed, required: false },
    weightLb: { type: Number, required: true },
    weightkg: { type: Number, required: true },
  },
  {
    query: {
      byId(id: string) {
        return this.where({ _id: id });
      },
      byIds(objectIds: Types.ObjectId[]) {
        return this.where({ _id: { $in: objectIds } });
      },
    },
    statics: {
      createDexEntry(dexEntry: IDexEntry) {
        const newDexEntry = new this(dexEntry);
        return newDexEntry.save();
      },
      upsertDexEntry(
        filter: QueryFilter<IDexEntry>,
        update: Partial<IDexEntry>
      ) {
        return this.findOneAndUpdate(filter, update, { upsert: true });
      },
    },
  }
);

export const DexEntry = model('DexEntry', DexEntrySchema, 'dexentries');
