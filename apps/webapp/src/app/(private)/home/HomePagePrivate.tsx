"use client";

import Image from "next/image";

import { trpc } from "@webapp/trpc";

export const HomePagePrivate = () => {
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const avatarUrl: string = user?.avatarUrl ?? "";

  return (
    <div>
      <div
        className="flex flex-row w-full justify-center items-center rounded-xl p-3 mx-auto
      bg-gray-400 dark:bg-gray-1200"
      >
        {avatarUrl ? (
          <Image
            alt={`${user?.username} avatar`}
            className="rounded-full border-2
            border-gray-1200 dark:border-gray-600"
            height={65}
            src={avatarUrl}
            width={65}
          />
        ) : null}
        <h1 className="text-3xl ml-4">{user?.globalName}</h1>
      </div>
    </div>
  );
};
