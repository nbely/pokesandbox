import { RootState } from "../index";
import { useAppSelector } from "./index";

import {
  selectServerById,
  selectServers,
  selectServersByIds,
} from "../serversSlice";

export const useGetServers = () => {
  return useAppSelector((state: RootState) => selectServers(state));
};

export const useGetServerById = (serverId: string) => {
  return useAppSelector((state: RootState) =>
    selectServerById(state, serverId),
  );
};

export const useGetServersByIds = (serverIds: string[]) => {
  return useAppSelector((state: RootState) =>
    selectServersByIds(state, serverIds),
  );
};
