import Link from "next/link";

import { useGlobalContext } from "@/context/globalProvider";
import { IServer } from "@/interfaces/models/server";
import { GetServerSideProps } from "next";
import React from "react";
import ServerCard from "./components/serverCard";

interface ServersProps {
  servers: IServer[];
}

const Servers: React.FC<ServersProps> = (props) => {
  const { getServers, updateServers } = useGlobalContext();
  const servers: IServer[] =
    getServers().length > 0 ? getServers() : props.servers;

  React.useEffect(() => {
    updateServers(props.servers);
  }, []);

  return (
    <div>
      <h1 className="text-center text-xl">Server Discovery</h1>
      <div className="flex flex-wrap justify-evenly mt-5">
        {servers.map((server: IServer) => (
          <ServerCard key={server.serverId} server={server} />
        ))}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  ServersProps
> = async () => {
  const dbServersResponse: Response = await fetch(
    `http://localhost:3000/servers/`
  );
  const servers = (await dbServersResponse.json()) as { data: IServer[] };

  return {
    props: {
      servers: servers.data,
    },
  };
};

export default Servers;
