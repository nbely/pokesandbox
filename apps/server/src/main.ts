import { createExpressEndpoints, initServer } from '@ts-rest/express';
import cors from 'cors';
import express from 'express';

import { connectDb, contract } from '@shared';

import { getRegion, getRegions } from './routes/regions';
import { getServers } from './routes/servers';
import { getUsers } from './routes/users';

connectDb().then(() => {
  const port = process.env.EXPRESS_PORT || 3333;
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cors());

  const s = initServer();

  const router = s.router(contract, {
    getRegion,
    getRegions,
    getServers,
    getUsers,
  });

  createExpressEndpoints(contract, router, app);

  app.listen(port, () =>
    console.info(`Express server is listening on port ${port}`),
  );
});
