import "@/styles/globals.scss";
import LayoutProvider from "./LayoutProvider";
import { PropsWithChildren } from "react";
import { IRegion } from "@/interfaces/models/region";
import { IServer } from "@/interfaces/models/server";
import { IUser } from "@/interfaces/models/user";

type AppData = {
  regions: IRegion[];
  servers: IServer[];
  users: IUser[];
}

export default async function RootLayout({children}: PropsWithChildren) {
  const data: AppData = {
    regions: [],
    servers: [],
    users: []
  }

  const dbRegionsResponse = (await fetch(`${process.env.API_URL}/regions/`)).clone();
  const dbServersResponse = (await fetch(`${process.env.API_URL}/servers/`)).clone();
  const dbUserResponse = (await fetch(`${process.env.API_URL}/users/`)).clone();

  const regions = (await dbRegionsResponse.json()) as { data: IRegion[] };
  const servers = (await dbServersResponse.json()) as { data: IServer[] };
  const users = (await dbUserResponse.json()) as { data: IUser[] };

  data.regions = regions.data;
  data.servers = servers.data;
  data.users = users.data;

  return (
    <html lang="en">
      <body>
        <LayoutProvider data={data}>
          {children}
        </LayoutProvider>
      </body>
    </html>
  )
}