import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { regionDTOSchema } from './schemas/region';
import { serverDTOSchema } from './schemas/server';
import { userDTOSchema } from './schemas/user';

const c = initContract();

export const contract = c.router({
  getRegion: {
    method: 'GET',
    path: '/regions/:id',
    responses: {
      200: regionDTOSchema.nullable(),
    },
    summary: 'Get a region by id',
  },
  getRegions: {
    method: 'GET',
    path: '/regions',
    responses: {
      200: z.array(regionDTOSchema),
    },
    summary: 'Get all regions',
  },
  getServers: {
    method: 'GET',
    path: '/servers',
    responses: {
      200: z.array(serverDTOSchema),
    },
  },
  getUsers: {
    method: 'GET',
    path: '/users',
    responses: {
      200: z.array(userDTOSchema),
    },
  },
});
