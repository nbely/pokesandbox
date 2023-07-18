import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import { serialize } from "cookie";
import { sign } from "jsonwebtoken";

import { DiscordUser } from "../../interfaces/discordUser";

const scope: string = ["identify"].join(" ");
const REDIRECT_URI: string = `${process.env.APP_URI}/api/oauth`;

const OAUTH_QS: string = new URLSearchParams({
  client_id: process.env.CLIENT_ID as string,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope,
}).toString();

const OAUTH_URI: string = `https://discord.com/api/oauth2/authorize?${OAUTH_QS}`;

const handleOAuth = async (req: NextApiRequest, res: NextApiResponse) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if (req.method !== "GET") return res.redirect("/");

  const { code = null, error = null } = req.query;

  if (error) {
    return res.redirect(`/?error=${req.query.error}`);
  }

  if (!code || typeof code !== "string") return res.redirect(OAUTH_URI);

  const body: string = new URLSearchParams({
    client_id: process.env.CLIENT_ID as string,
    client_secret: process.env.CLIENT_SECRET as string,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
    scope,
  }).toString();

  const { access_token = null, token_type = "Bearer" } = await fetch(
    "https://discord.com/api/oauth2/token",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body,
    },
  ).then((res): any => res.json());

  if (!access_token || typeof access_token !== "string") {
    return res.redirect(OAUTH_URI);
  }

  const me: DiscordUser | { unauthorized: true } = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers: {
        Authorization: `${token_type} ${access_token}`,
        ContentType: "application/x-www-form-urlencoded",
      },
    },
  ).then((res): any => res.json());

  if (!("id" in me)) {
    return res.redirect(OAUTH_URI);
  }

  const token = sign(me, process.env.JWT_SECRET as string, {
    expiresIn: "24h",
  });

  res.setHeader(
    "Set-Cookie",
    serialize(process.env.COOKIE_NAME as string, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
    }),
  );

  res.redirect("/");
};

export default handleOAuth;
