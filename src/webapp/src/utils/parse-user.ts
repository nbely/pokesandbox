import { parse } from "cookie";
import { verify } from "jsonwebtoken";

import type { DiscordUser } from "../interfaces/discordUser";

export function parseUser(cookies: string | string[] | undefined): DiscordUser | null {
  if (!cookies) {
    return null;
  }

  if (Array.isArray(cookies)) {
    cookies = cookies.join();
  }

  const token: string = parse(cookies)["discordAuth"];

  if (!token) {
    return null;
  }

  try {
    const { iat, exp, ...user } = verify(
      token,
      process.env.JWT_SECRET as string,
    ) as DiscordUser & { iat: number; exp: number };
    return user;
  } catch (e) {
    console.error(e);
    return null;
  }
}
