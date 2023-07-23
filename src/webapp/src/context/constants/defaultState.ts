import type { IState } from "@/interfaces/state";

export const DEFAULT_STATE: IState = {
  getServerById: () => undefined,
  getServersByIds: () => [],
  getServers: () => [],
  getUser: () => undefined,
  isDarkMode: true,
  toggleDarkMode: () => {},
  updateServers: () => {},
  updateUser: () => {},
};
