"use client";

import { trpc } from "@webapp/trpc";

import { SidebarButton, SidebarWrapper } from "@webapp/components/layout";

export const SidebarPrivate = () => {
  const { data: currentUser } = trpc.users.getCurrentUser.useQuery();

  return (
    <SidebarWrapper>
      {currentUser?.servers.map((server) => {
        const iconUrl: string | undefined = server.discovery.icon
          ? `https://cdn.discordapp.com/icons/${server.serverId}/${server.discovery.icon}.png`
          : undefined;

        return (
          <SidebarButton
            iconUrl={iconUrl}
            label={server.name}
            key={server.serverId}
            route={`servers/${server.serverId}`}
          />
        );
      })}
    </SidebarWrapper>
  );
};
