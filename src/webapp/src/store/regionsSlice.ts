import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { RootState } from ".";
import type { IRegion } from "@interfaces/models/region";

export interface RegionsState {
  regions: IRegion[];
}

const initialState: RegionsState = {
  regions: [],
};

const regionsSlice = createSlice({
  name: "regions",
  initialState,
  reducers: {
    setRegions: (state, action: PayloadAction<IRegion[]>) => {
      state.regions = action.payload;
    },
  },
});

export const { setRegions } = regionsSlice.actions;
export default regionsSlice.reducer;

export const selectRegions = (state: RootState) => state.regions.regions;
export const selectRegionById = createSelector(
  [selectRegions, (state, regionId: string) => regionId],
  (regions, regionId) =>
    regions.find((region: IRegion) => region._id === regionId)
);
export const selectRegionsByIds = createSelector(
  [selectRegions, (state, regionIds: string[]) => regionIds],
  (regions, regionIds) =>
    regions.filter((region: IRegion) => regionIds.includes(region._id))
);
