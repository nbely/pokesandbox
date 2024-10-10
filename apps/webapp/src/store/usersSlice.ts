import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { UserDTO } from "@shared";

import type { RootState } from "./index";

export interface UsersState {
  loggedInUser: UserDTO | null;
  users: UserDTO[];
}

const initialState: UsersState = {
  loggedInUser: null,
  users: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoggedInUser: (state, action: PayloadAction<UserDTO | null>) => {
      state.loggedInUser = action.payload;
    },
    setUsers: (state, action: PayloadAction<UserDTO[]>) => {
      state.users = action.payload;
    },
  },
});

export const { setLoggedInUser, setUsers } = usersSlice.actions;
export default usersSlice.reducer;

export const selectUsers = (state: RootState) => state.users.users;
export const selectUserById = createSelector(
  [selectUsers, (_state, userId: string) => userId],
  (users, userId) => {
    console.log(">>> users", users);
    return users.find(
      (user: UserDTO) =>
        user.userId === userId || user._id.toString() === userId
    );
  }
);
export const selectUsersByIds = createSelector(
  [selectUsers, (_state, userIds: string[]) => userIds],
  (users, userIds) =>
    users.filter(
      (user: UserDTO) =>
        userIds.includes(user.userId) || userIds.includes(user._id.toString())
    )
);
