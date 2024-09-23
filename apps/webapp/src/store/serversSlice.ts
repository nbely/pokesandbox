import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { ServerDTO } from "@shared";

import type { RootState } from "./index";

export interface ServerState {
  servers: ServerDTO[];
}

const initialState: ServerState = {
  servers: [],
};

const serverSlice = createSlice({
  name: "servers",
  initialState,
  reducers: {
    setServers: (state, action: PayloadAction<ServerDTO[]>) => {
      state.servers = action.payload;
    },
  },
});

export const { setServers } = serverSlice.actions;
export default serverSlice.reducer;

export const selectServers = (state: RootState) => state.servers.servers;
export const selectServerById = createSelector(
  [selectServers, (_state, serverId: string) => serverId],
  (servers, serverId) =>
    servers.find(
      (server: ServerDTO) =>
        server.serverId === serverId || server._id.toString() === serverId
    )
);
export const selectServersByIds = createSelector(
  [selectServers, (_state, serverIds: string[]) => serverIds],
  (servers, serverIds) =>
    servers.filter(
      (server: ServerDTO) =>
        serverIds.includes(server.serverId) ||
        serverIds.includes(server._id.toString())
    )
);
