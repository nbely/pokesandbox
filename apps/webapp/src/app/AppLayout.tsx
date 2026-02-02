import type { PropsWithChildren } from "react";

import { Layout } from "./_components/Layout";
import { Hydrator } from "./_components/Hydrator";
import Providers from "./_providers";
import type { AppData } from "./layout";

interface AppLayoutProps extends PropsWithChildren {
  data: AppData;
}

export default function AppLayout({ children, data }: AppLayoutProps) {
  return (
    <>
      <Hydrator data={data} />
      <Providers>
        <Layout>{children}</Layout>
      </Providers>
    </>
  );
}
