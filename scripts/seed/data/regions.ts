import { Types } from 'mongoose';
import { IRegion } from '../../../shared/src/models/region/region.model';
import { serverIds } from './servers';
import { userIds } from './users';

export const regionIds = {
  kantoClassic: new Types.ObjectId(),
  johtoLeague: new Types.ObjectId(),
};

export const regions: (IRegion & { _id: Types.ObjectId })[] = [
  {
    _id: regionIds.kantoClassic,
    name: 'Kanto Classic',
    baseGeneration: 1,
    charactersPerPlayer: 1,
    characterList: [],
    currencyType: 'PokéDollars',
    deployable: true,
    deployed: true,
    graphicSettings: {
      frontSpritesEnabled: true,
      backSpritesEnabled: true,
      iconSpritesEnabled: true,
    },
    locations: [],
    playerList: [userIds.ash, userIds.brock],
    pokedex: [],
    progressionDefinitions: new Map([
      [
        'badges',
        {
          kind: 'milestone' as const,
          name: 'Gym Badges',
          description: 'Collect all 8 Kanto gym badges',
          visibility: 'public' as const,
          sequential: true,
          milestones: [
            { key: 'boulder', label: 'Boulder Badge', ordinal: 1 },
            { key: 'cascade', label: 'Cascade Badge', ordinal: 2 },
            { key: 'thunder', label: 'Thunder Badge', ordinal: 3 },
            { key: 'rainbow', label: 'Rainbow Badge', ordinal: 4 },
            { key: 'soul', label: 'Soul Badge', ordinal: 5 },
            { key: 'marsh', label: 'Marsh Badge', ordinal: 6 },
            { key: 'volcano', label: 'Volcano Badge', ordinal: 7 },
            { key: 'earth', label: 'Earth Badge', ordinal: 8 },
          ],
        },
      ],
      [
        'pokédex',
        {
          kind: 'numeric' as const,
          name: 'Pokédex Completion',
          description: 'Number of Pokémon registered in the Pokédex',
          visibility: 'public' as const,
          min: 0,
          max: 151,
        },
      ],
    ]),
    quests: {
      active: [],
      passive: [],
      maxPassiveQuests: 3,
    },
    shops: [],
    transportationTypes: ['walk', 'bike', 'surf'],
  },
  {
    _id: regionIds.johtoLeague,
    name: 'Johto League',
    baseGeneration: 2,
    charactersPerPlayer: 2,
    characterList: [],
    currencyType: 'PokéDollars',
    deployable: true,
    deployed: false,
    graphicSettings: {
      frontSpritesEnabled: true,
      backSpritesEnabled: false,
      iconSpritesEnabled: true,
    },
    locations: [],
    playerList: [],
    pokedex: [],
    progressionDefinitions: new Map([
      [
        'badges',
        {
          kind: 'milestone' as const,
          name: 'Johto Badges',
          description: 'Collect all 8 Johto gym badges',
          visibility: 'public' as const,
          sequential: true,
          milestones: [
            { key: 'zephyr', label: 'Zephyr Badge', ordinal: 1 },
            { key: 'hive', label: 'Hive Badge', ordinal: 2 },
            { key: 'plain', label: 'Plain Badge', ordinal: 3 },
            { key: 'fog', label: 'Fog Badge', ordinal: 4 },
            { key: 'storm', label: 'Storm Badge', ordinal: 5 },
            { key: 'mineral', label: 'Mineral Badge', ordinal: 6 },
            { key: 'glacier', label: 'Glacier Badge', ordinal: 7 },
            { key: 'rising', label: 'Rising Badge', ordinal: 8 },
          ],
        },
      ],
    ]),
    quests: {
      active: [],
      passive: [],
    },
    shops: [],
    transportationTypes: ['walk', 'bike', 'surf', 'fly'],
  },
];

/** Map of which regions belong to which server (for back-populating server.regions). */
export const serverRegionMap: Record<string, Types.ObjectId[]> = {
  [serverIds.palletHub.toHexString()]: [regionIds.kantoClassic, regionIds.johtoLeague],
};
