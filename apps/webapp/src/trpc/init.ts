import { initTRPC, TRPCError } from "@trpc/server";

import { type Context } from "./context";

const t = initTRPC.context<Context>().create();

/**
 * Public Procedure
 * Use this for view-only public routes.
 * It has the DB connection from the context but no auth check.
 */
export const publicProcedure = t.procedure;

/**
 * Protected Procedure
 * Use this for private routes with possible mutations
 * It builds on top of the context and throws an error if no session exists.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { session: ctx.session } });
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
