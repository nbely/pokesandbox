import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, findAllRegions, findRegion, RegionDTO } from '@shared';

export const getRegion: AppRouteImplementation<
  typeof contract.getRegion
> = async ({ params: { id } }) => {
  const region = await findRegion({ _id: id });

  return {
    status: 200,
    body: RegionDTO.convertFromEntity(region),
  };
};

export const getRegions: AppRouteImplementation<
  typeof contract.getRegions
> = async () => {
  const regions = await findAllRegions();

  return {
    status: 200,
    body: regions.map((region) => RegionDTO.convertFromEntity(region)),
  };
};
