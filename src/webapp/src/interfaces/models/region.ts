export interface IRegion {
  _id: string;
  baseGeneration: number;
  charactersPerPlayer: number;
  characterList: string[];
  currencyType: string;
  deployable: boolean;
  deployed: boolean;
  graphicSettings: {
    backSpritesEnabled?: boolean;
    frontSpritesEnabled?: boolean;
    iconSpritesEnabled?: boolean;
    mapImageLink?: string;
  };
  locations: string[];
  name: string;
  playerList: string[];
  pokedex: string[];
  progressionTypes: {
    [key: string]: string[] | number;
  };
  quests: {
    active: string[];
    passive: string[];
    maxPassiveQuests?: number;
  };
  shops: string[];
  transportationTypes: string[];
}