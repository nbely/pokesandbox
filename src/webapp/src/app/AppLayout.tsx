"use client";

import { Fragment, PropsWithChildren } from "react";

import Layout from "./_components/Layout";
import Preloader from "./_components/preloader";
import Providers from "./_providers";
import type { AppData } from "./layout";

interface AppLayoutProps extends PropsWithChildren {
  data: AppData;
}

export default function AppLayout({ children, data }: AppLayoutProps) {
  return (
    <Fragment>
      <Preloader data={data} />
      <Providers>
        <Layout>{children}</Layout>
      </Providers>
    </Fragment>
  );
}
