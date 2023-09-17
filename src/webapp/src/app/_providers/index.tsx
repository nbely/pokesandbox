"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";

import { store } from "@store/index";

import ThemeProvider from "./themeProvider";

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    </SessionProvider>
  );
};

export default Providers;
