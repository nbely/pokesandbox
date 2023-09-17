'use client'

import { usePathname } from "next/navigation";

import { useGetRegionById } from "@/store/selectors/regionsSelectors";
import type { IRegion } from "@/interfaces/models/region";

const RegionPage: React.FC = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const regionId: string = pathParts[pathParts.length - 1];
  
  const region: IRegion | undefined = useGetRegionById(regionId);

  return (
    <div>
      <h1 className="text-xl">{region?.name}</h1>
    </div>
  );
};

export default RegionPage;
