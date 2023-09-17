"use client";

import { Fragment, PropsWithChildren } from "react";

import Layout from "./_components/Layout";
import Preloader from "./_components/preloader";
import Providers from "./_providers";
import type { AppData } from "./layout";

interface LayoutProviderProps extends PropsWithChildren {
  data: AppData;
}

export default function LayoutProvider({
  children,
  data,
}: LayoutProviderProps) {
  return (
    <Fragment>
      <Preloader data={data} />
      <Providers>
        <Layout>{children}</Layout>
      </Providers>
    </Fragment>
  );
}
