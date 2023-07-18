import { GetServerSideProps } from "next";
import Image from "next/image";
import fetch, { Response } from "node-fetch";

import { DiscordUser } from "@/interfaces/discordUser";
import { IUser } from "@/interfaces/models/user";
import { parseUser } from "@/utils/parse-user";

interface HomeProps {
  user: IUser;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const avatarUrl: string = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`
    : "";

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
  async function (ctx) {
    const discordUser: DiscordUser | null = parseUser(ctx);

    if (!discordUser) {
      return {
        redirect: {
          destination: "/api/oauth",
          permanent: false,
        },
      };
    }

    const dbUserResponse: Response = await fetch(
      `http://localhost:3000/user/${discordUser.id}`,
    );
    const user = (await dbUserResponse.json()) as { data: IUser };

    return {
      props: {
        user: user.data,
      },
    };
  };

export default Home;
