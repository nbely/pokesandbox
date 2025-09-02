import DiscordProvider from "next-auth/providers/discord";
import NextAuth from "next-auth/next";

const scopes = ["identify"].join(" ");
const handler = NextAuth({
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile) {
        try {
          // Make POST request to create user
          const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3333";
          const response = await fetch(`${serverUrl}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              username: profile.username || user.name || "",
              userTag: `${profile.username}#${profile.discriminator}` || user.name || "",
              avatar: user.image || undefined,
              servers: [], // Empty array for new users
            }),
          });

          // If user already exists, that's fine - just continue
          if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.message === "User already exists") {
              return true; // Allow sign in for existing users
            }
          }

          // If creation was successful or user exists, allow sign in
          if (response.ok || response.status === 400) {
            return true;
          }

          console.error("Failed to create user:", response.statusText);
          return true; // Allow sign in even if user creation fails
        } catch (error) {
          console.error("Error creating user:", error);
          return true; // Allow sign in even if there's an error
        }
      }
      return true;
    },
    jwt: ({ token, account, profile }) => {
      if (account && profile) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
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
