"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { RegionDTO, ServerDTO } from "@shared";
import { useGetRegionsByIds } from "@webapp/store/selectors/regionsSelectors";
import { useGetServerById } from "@webapp/store/selectors/serversSelectors";

const ServerPage = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const serverId: string = pathParts[pathParts.length - 1];

  const server: ServerDTO | undefined = useGetServerById(serverId);
  const regions: RegionDTO[] = useGetRegionsByIds(server?.regions ?? []);

  return (
    <div>
      <h1 className="text-xl">{server?.name}</h1>
      <br />
      <p>{server?.discovery.description}</p>
      <br />
      <h1 className="text-xl">Regions</h1>
      <br />
      <ul>
        {regions.map((region: RegionDTO) => (
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
