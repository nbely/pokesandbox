"use client";
import { usePathname } from "next/navigation";

import type { UserDTO } from "@shared";
import { useGetUserById } from "@webapp/store/selectors/usersSelectors";

const User = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const userId: string = pathParts[pathParts.length - 1];

  const user: UserDTO | undefined = useGetUserById(userId);

  return (
    <div>
      <h1 className="text-xl">{user?.globalName}</h1>
    </div>
  );
};

export default User;
