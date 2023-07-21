import type { IServer } from "@/interfaces/models/server";
import type { IState } from "@/interfaces/state";
import type { IUser } from "@/interfaces/models/user";

export const DEFAULT_STATE: IState = {
  getServerById: (serverId: string) => undefined,
  getServersByIds: (serverIds: string[]) => [],
  getServers: () => [],
  getUser: () => undefined,
  isDarkMode: true,
  toggleDarkMode: () => {},
  updateServers: (servers: IServer[]) => {},
  updateUser: (user: IUser) => {},
};
