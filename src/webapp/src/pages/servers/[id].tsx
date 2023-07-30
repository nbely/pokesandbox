import Link from "next/link";
import { useRouter } from "next/router";

import { getRegionsByIds } from "@/store/selectors/regionsSelectors";
import { getServerById } from "@/store/selectors/serversSelectors";

import type { IRegion } from "@/interfaces/models/region";
import type { IServer } from "@/interfaces/models/server";

const Server: React.FC = () => {
  const router = useRouter();
  let server: IServer | undefined = typeof router.query.id === "string"
    ? getServerById(router.query.id)
    : undefined;

  let regions: IRegion[] = [];
  if (server) {
    regions = getRegionsByIds(server.regions);
  }

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
          <Link 
            className="Link text-lg"
            href={`/regions/${region._id}`}
          >
              {region.name}
          </Link>
        </li>
      ))}

      </ul>
    </div>
  );
};

export default Server;
