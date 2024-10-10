"use client";
import type { PropsWithChildren } from "react";

import Layout from "./_components/Layout";
import Preloader from "./_components/preloader";
import Providers from "./_providers";
import type { AppData } from "./layout";

interface AppLayoutProps extends PropsWithChildren {
  data: AppData;
}

export default function AppLayout({ children, data }: AppLayoutProps) {
  return (
    <>
      <Preloader data={data} />
      <Providers>
        <Layout>{children}</Layout>
      </Providers>
    </>
  );
}
