import type { AppRouteQuery } from '@ts-rest/core';
import { z } from 'zod';

import { userDTOSchema } from '../schemas/user';

export const getUsers: AppRouteQuery = {
  method: 'GET',
  path: '/users',
  responses: {
    200: z.array(userDTOSchema),
  },
};
