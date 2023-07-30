import { DefaultSession } from "next-auth";

// nextauth.d.ts
declare module "next-auth" {
  interface User {
    email?: string | null | undefined;
    id?: string | null | undefined;
    image?: string | null | undefined;
    name?: string | null | undefined;
  }

  interface Session extends DefaultSession {
    user?: User | undefined;
  }
}
