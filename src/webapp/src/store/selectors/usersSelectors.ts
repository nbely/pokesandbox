import { RootState } from "../index";
import { useAppSelector } from "./index";

import {
  selectUserById,
  selectUsers,
  selectUsersByIds,
} from "../usersSlice";

export const getUsers = () => {
  return useAppSelector((state: RootState) => selectUsers(state));
};

export const getUserById = (userId: string) => {
  return useAppSelector((state: RootState) => selectUserById(state, userId));
};

export const getUsersByIds = (userIds: string[]) => {
  return useAppSelector((state: RootState) => selectUsersByIds(state, userIds));
};
