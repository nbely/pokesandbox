import { initContract } from '@ts-rest/core';

import { getRegion, getRegions } from './contracts/regions';
import { getServers } from './contracts/servers';
import { getUsers, createUser } from './contracts/users';

const c = initContract();

export const contract = c.router({
  getRegion,
  getRegions,
  getServers,
  getUsers,
  createUser,
});
