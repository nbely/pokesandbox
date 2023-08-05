import App, { AppContext, AppProps } from "next/app";

import "@/styles/globals.scss";
import Layout from "./components/layout";
import Preloader from "./components/preloader";
import Providers from "@/providers";

import type { IRegion } from "@/interfaces/models/region";
import type { IServer } from "@/interfaces/models/server";
import type { IUser } from "@/interfaces/models/user";

type CustomAppProps = Pick<AppProps, "Component" | "pageProps"> & {
  data: {
    regions: IRegion[];
    servers: IServer[];
    users: IUser[];
  };
};

const CustomApp = ({
  Component,
  pageProps: { session, ...pageProps },
  data,
}: CustomAppProps) => {
  return (
    <main>
      <Preloader data={data} />
      <Providers session={session}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Providers>
    </main>
  );
};

CustomApp.getInitialProps = async (context: AppContext) => {
  const ctx = await App.getInitialProps(context);

  const dbRegionsResponse = await fetch(`${process.env.API_URL}/regions/`);
  const dbServersResponse = await fetch(`${process.env.API_URL}/servers/`);
  const dbUserResponse = await fetch(`${process.env.API_URL}/users/`);
  const regions = (await dbRegionsResponse.json()) as { data: IRegion[] };
  const servers = (await dbServersResponse.json()) as { data: IServer[] };
  const users = (await dbUserResponse.json()) as { data: IUser[] };

  return {
    ...ctx,
    data: {
      regions: regions.data,
      servers: servers.data,
      users: users.data,
    },
  };
};

export default CustomApp;
