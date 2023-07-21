import { GetServerSidePropsContext } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";

import { DiscordUser } from "../interfaces/discordUser";

export function parseUser(ctx: GetServerSidePropsContext): DiscordUser | null {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  if (!ctx.req.headers.cookie) {
    return null;
  }

  const token: string = parse(ctx.req.headers.cookie)[
    process.env.COOKIE_NAME as string
  ];

  if (!token) {
    return null;
  }

  try {
    const { iat, exp, ...user } = verify(
      token,
      process.env.JWT_SECRET as string
    ) as DiscordUser & { iat: number; exp: number };
    return user;
  } catch (e) {
    return null;
  }
}
