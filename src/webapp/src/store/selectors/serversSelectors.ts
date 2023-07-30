import { RootState } from "../index";
import { useAppSelector } from "./index";

import {
  selectServerById,
  selectServers,
  selectServersByIds,
} from "../serversSlice";

export const getServers = () => {
  return useAppSelector((state: RootState) => selectServers(state));
};

export const getServerById = (serverId: string) => {
  return useAppSelector((state: RootState) => selectServerById(state, serverId));
};

export const getServersByIds = (serverIds: string[]) => {
  return useAppSelector((state: RootState) => selectServersByIds(state, serverIds));
};
