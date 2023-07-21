import { PropsWithChildren, createContext, useContext, useState } from "react";
import { ConfigProvider, theme } from "antd";
import { IUser } from "@/interfaces/models/user";
import { IServer } from "@/interfaces/models/server";

export interface IState {
  getServerById: (serverId: string) => IServer | undefined;
  getServers: () => IServer[];
  getUser: () => IUser | undefined;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  updateServers: (servers: IServer[]) => void;
  updateUser: (user: IUser) => void;
}

const defaultState: IState = {
  getServerById: (serverId: string) => undefined,
  getServers: () => [],
  getUser: () => undefined,
  isDarkMode: true,
  toggleDarkMode: () => {},
  updateServers: (servers: IServer[]) => {},
  updateUser: (user: IUser) => {},
};

const GlobalContext: React.Context<IState> =
  createContext<IState>(defaultState);

interface GlobalContextProps extends PropsWithChildren {}

const GlobalProvider: React.FC<GlobalContextProps> = ({ children }) => {
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [servers, setServers] = useState<IServer[]>([]);
  const [user, setUser] = useState<IUser | undefined>(undefined);

  const getServerById = (serverId: string): IServer | undefined => {
    return servers.find((server: IServer) => server.serverId === serverId);
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
