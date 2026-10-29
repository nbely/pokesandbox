export type LocationsMenuState = {
  prompt?: string;
  warningMessage?: string;
};

export type LocationMenuState = {
  prompt?: string;
  warningMessage?: string;
};

export type LocationsCommandOptions = {
  region_id: string;
};

export type LocationCommandOptions = {
  region_id: string;
  location_id: string;
};
