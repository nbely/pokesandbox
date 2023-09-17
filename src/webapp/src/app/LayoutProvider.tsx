'use client'

import Providers from "./providers";
import { Fragment, PropsWithChildren } from "react";
import Layout from "./components/Layout";
import Preloader from "./components/preloader";
import { IRegion } from "@/interfaces/models/region";
import { IServer } from "@/interfaces/models/server";
import { IUser } from "@/interfaces/models/user";

interface LayoutProviderProps extends PropsWithChildren {
  data: {
    regions: IRegion[];
    servers: IServer[];
    users: IUser[];
  }
}

export default function LayoutProvider({children, data}: LayoutProviderProps) {

  return (
    <Fragment>
      <Preloader data={data} />
      <Providers>
        <Layout>
          {children}
        </Layout>
      </Providers>
    </Fragment>
  )
}