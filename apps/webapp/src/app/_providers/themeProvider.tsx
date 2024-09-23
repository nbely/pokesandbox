"use client";
import { ConfigProvider, theme } from "antd";
import type { PropsWithChildren } from "react";

import { useAppSelector } from "@webapp/store/selectors";

const ThemeProvider = ({ children }: PropsWithChildren) => {
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
