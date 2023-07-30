import { RootState } from "../index";
import { useAppSelector } from "./index";

import { selectUserById, selectUsers, selectUsersByIds } from "../usersSlice";

export const useGetUsers = () => {
  return useAppSelector((state: RootState) => selectUsers(state));
};

export const useGetUserById = (userId: string) => {
  return useAppSelector((state: RootState) => selectUserById(state, userId));
};

export const useGetUsersByIds = (userIds: string[]) => {
  return useAppSelector((state: RootState) => selectUsersByIds(state, userIds));
};
