import { ConfigProvider, theme } from "antd";
import React, { PropsWithChildren } from "react";

import { useAppSelector } from "@/store/selectors";

const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const isDarkMode = useAppSelector((state) => state.config.isDarkMode);
  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      }}
    >
        {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
