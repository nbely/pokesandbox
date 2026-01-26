import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, Region, RegionDTO } from '@shared';

export const getRegion: AppRouteImplementation<
  typeof contract.getRegion
> = async ({ params: { id } }) => {
  const region = await Region.findById(id);

  if (!region) {
    return {
      status: 404,
      body: { message: 'Region not found' },
    };
  }

  return {
    status: 200,
    body: RegionDTO.convertFromEntity(region),
  };
};

export const getRegions: AppRouteImplementation<
  typeof contract.getRegions
> = async () => {
  const regions = await Region.find();

  return {
    status: 200,
    body: regions.map((region) => RegionDTO.convertFromEntity(region)),
  };
};
