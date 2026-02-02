"use client";

import { usePathname } from "next/navigation";

import { trpc } from "@webapp/trpc";

const User = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const userId: string = pathParts[pathParts.length - 1];

  const { data: user } = trpc.users.getByUserId.useQuery(userId);

  return (
    <div>
      <h1 className="text-xl">{user?.globalName}</h1>
    </div>
  );
};

export default User;
