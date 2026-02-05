"use client";

import { SessionProvider } from "next-auth/react";
import type { PropsWithChildren } from "react";

import { ThemeProvider } from "./ThemeProvider";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
