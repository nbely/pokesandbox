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

  const dbRegionsResponse = (
    await fetch(`${process.env.API_URL}/regions`)
  ).clone();
  const dbServersResponse = (
    await fetch(`${process.env.API_URL}/servers`)
  ).clone();
  const dbUserResponse = (await fetch(`${process.env.API_URL}/users`)).clone();

  const regions = (await dbRegionsResponse.json()) as { data: RegionDTO[] };
  const servers = (await dbServersResponse.json()) as { data: ServerDTO[] };
  const users = (await dbUserResponse.json()) as { data: UserDTO[] };

  data.regions = regions.data;
  data.servers = servers.data;
  data.users = users.data;

  return (
    <html lang="en">
      <body>
        <AppLayout data={data}>{children}</AppLayout>
      </body>
    </html>
  );
}
