import "../styles/globals.scss";

import type { PropsWithChildren } from "react";

import { RegionDTO, ServerDTO, UserDTO } from "@shared";
import { TRPCProvider, trpcServer } from "@webapp/trpc";

import AppLayout from "./AppLayout";

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
    <html lang="en">
      <body>
        <AppLayout
          data={{
            regions,
            servers,
            users,
          }}
        >
          <TRPCProvider>{children}</TRPCProvider>
        </AppLayout>
      </body>
    </html>
  );
}
