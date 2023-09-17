import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { RootState } from ".";
import type { IUser } from "@interfaces/models/user";

export interface UsersState {
  loggedInUser: IUser | null;
  users: IUser[];
}

const initialState: UsersState = {
  loggedInUser: null,
  users: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoggedInUser: (state, action: PayloadAction<IUser>) => {
      state.loggedInUser = action.payload;
    },
    setUsers: (state, action: PayloadAction<IUser[]>) => {
      state.users = action.payload;
    },
  },
});

export const { setLoggedInUser, setUsers } = usersSlice.actions;
export default usersSlice.reducer;

export const selectUsers = (state: RootState) => state.users.users;
export const selectUserById = createSelector(
  [selectUsers, (state, userId: string) => userId],
  (users, userId) =>
    users.find((user: IUser) => user.userId === userId || user._id === userId)
);
export const selectUsersByIds = createSelector(
  [selectUsers, (state, userIds: string[]) => userIds],
  (users, userIds) =>
    users.filter(
      (user: IUser) =>
        userIds.includes(user.userId) || userIds.includes(user._id)
    )
);
