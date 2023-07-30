import { RootState } from "../index";
import { useAppSelector } from "./index";

import {
  selectRegionById,
  selectRegions,
  selectRegionsByIds,
} from "../regionsSlice";

export const getRegions = () => {
  return useAppSelector((state: RootState) => selectRegions(state));
};

export const getRegionById = (regionId: string) => {
  return useAppSelector((state: RootState) => selectRegionById(state, regionId));
};

export const getRegionsByIds = (regionIds: string[]) => {
  return useAppSelector((state: RootState) => selectRegionsByIds(state, regionIds));
};
