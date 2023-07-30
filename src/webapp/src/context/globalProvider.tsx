import { ConfigProvider, theme } from "antd";
import React, { PropsWithChildren, createContext, useContext, useState } from "react";

import { DEFAULT_STATE } from "./constants/defaultState";

import type { IState } from "@/interfaces/state";

interface GlobalContextProps extends PropsWithChildren {}

const GlobalContext: React.Context<IState> =
  createContext<IState>(DEFAULT_STATE);

const GlobalProvider: React.FC<GlobalContextProps> = ({ children }) => {
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode);
  };


  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <GlobalContext.Provider
        value={{
          isDarkMode,
          toggleDarkMode,
        }}
      >
        {children}
      </GlobalContext.Provider>
    </ConfigProvider>
  );
};

export const useGlobalContext = () => useContext<IState>(GlobalContext);

export default GlobalProvider;
