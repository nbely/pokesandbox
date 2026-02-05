"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { trpc } from "@webapp/trpc";

const ServerPage = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const serverId: string = pathParts[pathParts.length - 1];

  const { data: server } = trpc.servers.getByIdWithRegions.useQuery(serverId);

  return (
    <div>
      <h1 className="text-xl">{server?.name}</h1>
      <br />
      <p>{server?.discovery.description}</p>
      <br />
      <h1 className="text-xl">Regions</h1>
      <br />
      <ul>
        {server?.regions.map((region) => (
          <li key={region._id}>
            <Link className="Link text-lg" href={`/regions/${region._id}`}>
              {region.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServerPage;
