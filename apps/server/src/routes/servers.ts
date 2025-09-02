import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, findAllServers, ServerDTO } from '@shared';

export const getServers: AppRouteImplementation<
  typeof contract.getServers
> = async () => {
  const servers = await findAllServers();

  return {
    status: 200,
    body: servers.map((server) => ServerDTO.convertFromEntity(server)),
  };
};
