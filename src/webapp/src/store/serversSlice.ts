import { createSelector } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { IServer } from "@/interfaces/models/server";
import { RootState } from ".";

export interface ServerState {
  servers: IServer[];
}

const initialState: ServerState = {
  servers: [],
};

const serverSlice = createSlice({
  name: "servers",
  initialState,
  reducers: {
    setServers: (state, action: PayloadAction<IServer[]>) => {
      state.servers = action.payload;
    },
  },
});

export const { setServers } = serverSlice.actions;
export default serverSlice.reducer;

export const selectServers = (state: RootState) => state.servers.servers;
export const selectServerById = createSelector(
  [
    selectServers,
    (state, serverId: string) => serverId,
  ],
  (servers, serverId) =>
    servers.find((server: IServer) =>
      server.serverId === serverId || server._id === serverId
    )
);
export const selectServersByIds = createSelector(
  [
    selectServers,
    (state, serverIds: string[]) => serverIds,
  ],
  (servers, serverIds) =>
    servers.filter((server: IServer) =>
      serverIds.includes(server.serverId) || serverIds.includes(server._id)
    )
);
