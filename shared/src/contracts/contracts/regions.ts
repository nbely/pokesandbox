import type { AppRouteQuery } from '@ts-rest/core';
import { z } from 'zod';

import { regionDTOSchema } from '../schemas/region';

export const getRegion: AppRouteQuery = {
  method: 'GET',
  path: '/regions/:id',
  responses: {
    200: regionDTOSchema.nullable(),
  },
  summary: 'Get a region by id',
};

export const getRegions: AppRouteQuery = {
  method: 'GET',
  path: '/regions',
  responses: {
    200: z.array(regionDTOSchema),
  },
  summary: 'Get all regions',
};
