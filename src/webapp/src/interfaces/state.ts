import type { IServer } from "./models/server";
import type { IUser } from "./models/user";

export interface IState {
  getServerById: (serverId: string) => IServer | undefined;
  getServersByIds: (serverIds: string[]) => IServer[];
  getServers: () => IServer[];
  getUser: () => IUser | undefined;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  updateServers: (servers: IServer[]) => void;
  updateUser: (user: IUser) => void;
}
