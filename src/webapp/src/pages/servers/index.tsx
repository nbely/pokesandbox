import React from "react";

import ServerCard from "./components/serverCard";

import type { IServer } from "@/interfaces/models/server";
import { getServers } from "@/store/selectors/serversSelectors";

interface ServersProps {
  servers: IServer[];
}

const Servers: React.FC<ServersProps> = () => {
  const servers: IServer[] = getServers();

  return (
    <div>
      <h1 className="text-center text-xl">Server Discovery</h1>
      <div className="flex flex-wrap justify-evenly mt-5">
        {servers.map((server: IServer) =>
          server.discovery.enabled ? (
            <ServerCard key={server.serverId} server={server} />
          ) : null,
        )}
      </div>
    </div>
  );
};

export default Servers;
