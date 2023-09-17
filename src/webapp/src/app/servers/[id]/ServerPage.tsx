'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useGetRegionsByIds } from "@/store/selectors/regionsSelectors";
import { useGetServerById } from "@/store/selectors/serversSelectors";
import type { IRegion } from "@/interfaces/models/region";
import type { IServer } from "@/interfaces/models/server";

const ServerPage: React.FC = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const serverId: string = pathParts[pathParts.length - 1];

  let server: IServer | undefined = useGetServerById(serverId);
  let regions: IRegion[] = useGetRegionsByIds(server?.regions ?? []);

  return (
    <div>
      <h1 className="text-xl">{server?.name}</h1>
      <br />
      <p>{server?.discovery.description}</p>
      <br />
      <h1 className="text-xl">Regions</h1>
      <br />
      <ul>
        {regions.map((region: IRegion) => (
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
