import { Types } from 'mongoose';

export type PokedexMenuState = {
  prompt?: string;
  thumbnail?: string;
};

export type NavigateMenuOptions = {
  commandName: string;
  navigatePayload?: Record<string, any>;
};

export type PokedexSlotCustomizeMenuState = {
  region_id?: string;
  pokedex_no?: string;
};

export type Slot = {
  name: string;
  id: Types.ObjectId;
  isBaseFormNotIncluded?: boolean;
  baseFormOrdinal?: number;
  includedForms?: { id: Types.ObjectId; ordinal: number }[];
};

export type Form = {
  id: Types.ObjectId;
  name: string;
};
