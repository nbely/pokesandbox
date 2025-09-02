import type { AppRouteQuery, AppRouteMutation } from '@ts-rest/core';
import { z } from 'zod';

import { userDTOSchema, userRequestDTOSchema } from '../schemas/user';

export const getUsers: AppRouteQuery = {
  method: 'GET',
  path: '/users',
  responses: {
    200: z.array(userDTOSchema),
  },
};

export const createUser: AppRouteMutation = {
  method: 'POST',
  path: '/users',
  body: userRequestDTOSchema,
  responses: {
    201: userDTOSchema,
    400: z.object({
      message: z.string(),
    }),
  },
};
