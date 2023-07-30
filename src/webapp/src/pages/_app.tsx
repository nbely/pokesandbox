import App, { AppContext, AppProps } from "next/app";

import { setLoggedInUser, setUsers } from "@/store/usersSlice";
import { setRegions } from "@/store/regionsSlice";
import { setServers } from "@/store/serversSlice";
import { store } from "@/store";

import "@/styles/globals.scss";
import { DiscordUser } from "@/interfaces/discordUser";
import Layout from "./components/layout";
import Preloader from "./components/preloader";
import Providers from "@/providers";
import { parseUser } from "@/utils/parse-user";

import type { IRegion } from "@/interfaces/models/region";
import type { IServer } from "@/interfaces/models/server";
import type { IUser } from "@/interfaces/models/user";

type TProps = Pick<AppProps, "Component" | "pageProps"> & {
  data: {
    loggedInUser: IUser;
    regions: IRegion[];
    servers: IServer[];
    users: IUser[];
  };
}

const CustomApp = ({ Component, pageProps, data }: TProps) => {
  if (data) {
    store.dispatch(setRegions(data.regions));
    store.dispatch(setServers(data.servers));
    store.dispatch(setUsers(data.users));
    store.dispatch(setLoggedInUser(data.loggedInUser));
  }

  return (
    <Providers>
      <Preloader data={data} />
      <Providers>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Providers>
    </Providers>
  );
};

CustomApp.getInitialProps = async (context: AppContext) => {
  const ctx = await App.getInitialProps(context);
  const discordUser: DiscordUser | null = parseUser(context.ctx.req?.headers.cookie);

  if (!discordUser) {
    if (context.ctx.res) {
      context.ctx.res.writeHead(307, { Location: "/api/oauth" });
      context.ctx.res.end();
    }
    return {}
  }
  const dbRegionsResponse = await fetch(
    `http://localhost:3000/regions/`,
  );
  const dbServersResponse = await fetch(
    `http://localhost:3000/servers/`,
  );
  const dbUserResponse = await fetch(
    `http://localhost:3000/users/`,
  );
  const regions = (await dbRegionsResponse.json()) as { data: IRegion[] };
  const servers = (await dbServersResponse.json()) as { data: IServer[] };
  const users = (await dbUserResponse.json()) as { data: IUser[] };
  const loggedInUser = users.data.find((user) => user.userId === discordUser.id);

  return { ...ctx, data: {
    loggedInUser,
    regions: regions.data,
    servers: servers.data, 
    users: users.data,
  } };
}

export default CustomApp;
