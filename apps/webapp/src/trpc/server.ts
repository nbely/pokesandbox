import "server-only"; // Safety: Ensures this never runs in the browser

import { createTRPCContext } from "./context";
import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";

// Factory to create a direct server-side caller
const createCaller = createCallerFactory(appRouter);

export const trpcServer = async () => {
  // Every time we call this on the server, it runs our context
  // logic (dbConnect + auth check)
  const context = await createTRPCContext();
  return createCaller(context);
};
