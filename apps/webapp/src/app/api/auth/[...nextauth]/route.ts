import DiscordProvider from "next-auth/providers/discord";
import NextAuth from "next-auth/next";

const scopes = ["identify"].join(" ");
const handler = NextAuth({
  callbacks: {
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: { params: { scope: scopes } },
    }),
  ],
});

export { handler as GET, handler as POST };
