import { configureStore } from "@reduxjs/toolkit";

import configReducer from "./configSlice";
import regionsReducer from "./regionsSlice";
import searchReducer from "./searchSlice";
import serversReducer from "./serversSlice";
import usersReducer from "./usersSlice";

export const store = configureStore({
  reducer: {
    config: configReducer,
    regions: regionsReducer,
    search: searchReducer,
    servers: serversReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
