import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { RegionDTO } from "@shared";

import type { RootState } from "./index";

export interface RegionsState {
  regions: RegionDTO[];
}

const initialState: RegionsState = {
  regions: [],
};

const regionsSlice = createSlice({
  name: "regions",
  initialState,
  reducers: {
    setRegions: (state, action: PayloadAction<RegionDTO[]>) => {
      state.regions = action.payload;
    },
  },
});

export const { setRegions } = regionsSlice.actions;
export default regionsSlice.reducer;

export const selectRegions = (state: RootState): RegionDTO[] =>
  state.regions.regions;
export const selectRegionById = createSelector(
  [selectRegions, (state, regionId: string) => regionId],
  (regions, regionId) =>
    regions.find((region: RegionDTO) => region._id.toString() === regionId)
);
export const selectRegionsByIds = createSelector(
  [selectRegions, (state, regionIds: string[]) => regionIds],
  (regions, regionIds) =>
    regions.filter((region: RegionDTO) =>
      regionIds.includes(region._id.toString())
    )
);
