import "../styles/globals.scss";

import type { PropsWithChildren } from "react";

import { RegionDTO, ServerDTO, UserDTO } from "@shared";
import { TRPCProvider } from "@webapp/trpc";
import { trpcServer } from "@webapp/trpc/server";

import AppLayout from "./AppLayout";
import { DarkModeScript } from "./_components/DarkModeScript";

export type AppData = {
  regions: RegionDTO[];
  servers: ServerDTO[];
  users: UserDTO[];
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const api = await trpcServer();

  const [regions, servers, users] = await Promise.all([
    api.regions.getAll(),
    api.servers.getAll(),
    api.users.getAll(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>
          <DarkModeScript />
          <AppLayout
            data={{
              regions,
              servers,
              users,
            }}
          >
            {children}
          </AppLayout>
        </TRPCProvider>
      </body>
    </html>
  );
}
