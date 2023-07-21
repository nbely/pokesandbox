import { ConfigProvider, theme } from "antd";
import { PropsWithChildren, createContext, useContext, useState } from "react";

import { DEFAULT_STATE } from "./constants/defaultState";

import type { IServer } from "@/interfaces/models/server";
import type { IState } from "@/interfaces/state";
import type { IUser } from "@/interfaces/models/user";

interface GlobalContextProps extends PropsWithChildren {}

const GlobalContext: React.Context<IState> =
  createContext<IState>(DEFAULT_STATE);

const GlobalProvider: React.FC<GlobalContextProps> = ({ children }) => {
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [servers, setServers] = useState<IServer[]>([]);
  const [user, setUser] = useState<IUser | undefined>(undefined);

  const getServerById = (serverId: string): IServer | undefined => {
    return servers.find(
      (server: IServer) =>
        server.serverId === serverId || server._id === serverId
    );
  };

  const getServersByIds = (serverIds: string[]): IServer[] => {
    return servers.filter(
      (server: IServer) =>
        serverIds.includes(server.serverId) || serverIds.includes(server._id)
    );
  };

  const getServers = (): IServer[] => {
    return servers.map((server: IServer) => ({ ...server }));
  };

  const getUser = (): IUser | undefined => {
    return user ? { ...user } : undefined;
  };

  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode);
  };

  const updateServers = (servers: IServer[]): void => {
    setServers(servers.map((server: IServer) => ({ ...server })));
  };

  const updateUser = (user: IUser): void => {
    setUser({ ...user });
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <GlobalContext.Provider
        value={{
          getServerById,
          getServersByIds,
          getServers,
          getUser,
          isDarkMode,
          toggleDarkMode,
          updateServers,
          updateUser,
        }}
      >
        {children}
      </GlobalContext.Provider>
    </ConfigProvider>
  );
};

export const useGlobalContext = (): IState => {
  return useContext(GlobalContext);
};

export default GlobalProvider;
