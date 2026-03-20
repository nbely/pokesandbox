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
