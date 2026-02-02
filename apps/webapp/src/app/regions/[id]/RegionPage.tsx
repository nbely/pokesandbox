"use client";

import { usePathname } from "next/navigation";

import { trpc } from "@webapp/trpc";

const RegionPage = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const regionId: string = pathParts[pathParts.length - 1];

  const { data: region } = trpc.regions.getById.useQuery(regionId);

  return (
    <div>
      <h1 className="text-xl">{region?.name}</h1>
    </div>
  );
};

export default RegionPage;
