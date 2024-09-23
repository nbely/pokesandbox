"use client";
import { SessionProvider } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { store } from "@webapp/store/index";

import ThemeProvider from "./themeProvider";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    </SessionProvider>
  );
};

export default Providers;
