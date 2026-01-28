import { router } from "../init";
import { regionsRouter } from "./regions";
import { serversRouter } from "./servers";
import { usersRouter } from "./users";

export const appRouter = router({
  regions: regionsRouter,
  servers: serversRouter,
  users: usersRouter,
});

// This type is exported to be used by the client-side trpc.ts
export type AppRouter = typeof appRouter;
