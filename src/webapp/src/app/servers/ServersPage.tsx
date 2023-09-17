"use client";

import React from "react";

import ServerCard from "./components/ServerCard";
import { useGetServers } from "@store/selectors/serversSelectors";
import type { IServer } from "@interfaces/models/server";

const ServersPage: React.FC = () => {
  const servers: IServer[] = useGetServers();

  return (
    <div>
      <h1 className="text-center text-xl">Server Discovery</h1>
      <div className="flex flex-wrap justify-evenly mt-5">
        {servers.map((server: IServer) =>
          server.discovery.enabled ? (
            <ServerCard key={server.serverId} server={server} />
          ) : null
        )}
      </div>
    </div>
  );
};

export default ServersPage;
