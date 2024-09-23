import type { AppRouteImplementation } from '@ts-rest/express';

import { contract, Server, ServerDTO } from '@shared';

export const getServers: AppRouteImplementation<
  typeof contract.getServers
> = async () => {
  const servers = await Server.find({});

  return {
    status: 200,
    body: servers.map((server) => ServerDTO.convertFromEntity(server)),
  };
};
