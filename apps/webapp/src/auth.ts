import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

import { trpcServer } from "./trpc/server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord],
  callbacks: {
    async signIn({ user, profile }) {
      if (profile) {
        try {
          const trpc = await trpcServer();
          await trpc.users.create({
            avatarUrl: profile.image_url as string | undefined,
            globalName: profile.global_name as string,
            servers: [],
            userId: profile.id as string,
            username: profile.username as string,
          });
        } catch (error) {
          // Log error but allow sign in to proceed
          console.error("Error creating/updating user:", error);
        }
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile) token.id = profile.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
