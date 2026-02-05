"use client";

import type { ServerDTO } from "@shared";
import { trpc } from "@webapp/trpc";

import ServerCard from "./components/ServerCard";

const ServersPage = () => {
  const { data: servers = [] } = trpc.servers.getAll.useQuery();

  return (
    <div>
      <h1 className="text-center text-xl">Server Discovery</h1>
      <div className="flex flex-wrap justify-evenly mt-5">
        {servers.map((server: ServerDTO) =>
          server.discovery.enabled ? (
            <ServerCard key={server.serverId} server={server} />
          ) : null
        )}
      </div>
    </div>
  );
};

export default ServersPage;
