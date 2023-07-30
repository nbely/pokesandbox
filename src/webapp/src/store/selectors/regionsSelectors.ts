import { RootState } from "../index";
import { useAppSelector } from "./index";

import {
  selectRegionById,
  selectRegions,
  selectRegionsByIds,
} from "../regionsSlice";

export const useGetRegions = () => {
  return useAppSelector((state: RootState) => selectRegions(state));
};

export const useGetRegionById = (regionId: string) => {
  return useAppSelector((state: RootState) =>
    selectRegionById(state, regionId),
  );
};

export const useGetRegionsByIds = (regionIds: string[]) => {
  return useAppSelector((state: RootState) =>
    selectRegionsByIds(state, regionIds),
  );
};
