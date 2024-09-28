import { z } from 'zod';
import type { AppRouteQuery } from '@ts-rest/core';

import { serverDTOSchema } from '../schemas/server';

export const getServers: AppRouteQuery = {
  method: 'GET',
  path: '/servers',
  responses: {
    200: z.array(serverDTOSchema),
  },
};
