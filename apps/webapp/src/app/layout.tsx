import type { PropsWithChildren } from "react";

import "../styles/globals.scss";
import type { RegionDTO, ServerDTO, UserDTO } from "@shared";

import AppLayout from "./AppLayout";

export type AppData = {
  regions: RegionDTO[];
  servers: ServerDTO[];
  users: UserDTO[];
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const data: AppData = {
    regions: [],
    servers: [],
    users: [],
  };

  // Only fetch data if API_URL is defined (for production/dev builds with server)
  if (process.env.API_URL) {
    const dbRegionsResponse = (
      await fetch(`${process.env.API_URL}/regions`)
    ).clone();
    const dbServersResponse = (
      await fetch(`${process.env.API_URL}/servers`)
    ).clone();
    const dbUserResponse = (await fetch(`${process.env.API_URL}/users`)).clone();

    const regions: RegionDTO[] = await dbRegionsResponse.json();
    const servers = await dbServersResponse.json();
    const users: UserDTO[] = await dbUserResponse.json();

    data.regions = regions;
    data.servers = servers;
    data.users = users;
  }

  return (
    <html lang="en">
      <body>
        <AppLayout data={data}>{children}</AppLayout>
      </body>
    </html>
  );
}
