import "../styles/globals.scss";

import type { PropsWithChildren } from "react";

import { TRPCProvider } from "@webapp/trpc";
import { trpcServer } from "@webapp/trpc/server";

import { Hydrator } from "./_components/Hydrator";
import { DarkModeScript } from "./_components/scripts/DarkModeScript";
import Providers from "./_providers";

export default async function RootLayout({ children }: PropsWithChildren) {
  const api = await trpcServer();

  const [regions, servers, users] = await Promise.all([
    api.regions.getAll(),
    api.servers.getAll(),
    api.users.getAll(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>
          <DarkModeScript />
          <Hydrator
            data={{
              regions,
              servers,
              users,
            }}
          />
          <Providers>{children}</Providers>
        </TRPCProvider>
      </body>
    </html>
  );
}
