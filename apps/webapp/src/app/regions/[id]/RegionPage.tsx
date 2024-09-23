"use client";
import { usePathname } from "next/navigation";

import type { RegionDTO } from "@shared";
import { useGetRegionById } from "@webapp/store/selectors/regionsSelectors";

const RegionPage = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const regionId: string = pathParts[pathParts.length - 1];

  const region: RegionDTO | undefined = useGetRegionById(regionId);

  return (
    <div>
      <h1 className="text-xl">{region?.name}</h1>
    </div>
  );
};

export default RegionPage;
