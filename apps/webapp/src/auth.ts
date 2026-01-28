import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord],
  callbacks: {
    async jwt({ token, profile, account, user, session }) {
      if (profile) token.id = profile.id;
      return token;
    },
    async session({ session, token, user }) {
      if (session.user && token.sub) session.user.id = token.id as string;
      return session;
    },
  },
});
