import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import React from "react";
import fetch, { Response } from "node-fetch";

import { DiscordUser } from "@/interfaces/discordUser";
import { parseUser } from "@/utils/parse-user";
import { useGlobalContext } from "@/context/globalProvider";

import type { IServer } from "@/interfaces/models/server";
import type { IUser } from "@/interfaces/models/user";

interface HomeProps {
  servers: IServer[];
  user: IUser;
}

const Home: React.FC<HomeProps> = (props) => {
  const { getUser, updateUser, updateServers } = useGlobalContext();
  const user: IUser = getUser() ?? props.user;

  const avatarUrl: string = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`
    : "";

  React.useEffect(() => {
    updateServers(props.servers);
    updateUser(props.user);
  }, []);

  return (
    <div>
      <div
        className="flex flex-row w-full justify-center items-center rounded-xl p-3 mx-auto
      bg-gray-400 dark:bg-gray-1200"
      >
        {avatarUrl ? (
          <Image
            alt={`${user.username} avatar`}
            className="rounded-full border-2
            border-gray-1200 dark:border-gray-600"
            height={65}
            src={avatarUrl}
            width={65}
          />
        ) : null}
        <h1 className="text-3xl ml-4">{user.userTag}</h1>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> =
  async function (ctx: GetServerSidePropsContext) {
    const discordUser: DiscordUser | null = parseUser(ctx);

    if (!discordUser) {
      return {
        redirect: {
          destination: "/api/oauth",
          permanent: false,
        },
      };
    }

    const dbServersResponse: Response = await fetch(
      `http://localhost:3000/servers/`,
    );
    const dbUserResponse: Response = await fetch(
      `http://localhost:3000/user/${discordUser.id}`,
    );

    const servers = (await dbServersResponse.json()) as { data: IServer[] };
    const user = (await dbUserResponse.json()) as { data: IUser };

    return {
      props: {
        servers: servers.data,
        user: user.data,
      },
    };
  };

export default Home;
