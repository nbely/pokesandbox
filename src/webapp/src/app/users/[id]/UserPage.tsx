'use client'

import { usePathname } from "next/navigation";

import { useGetUserById } from "@/store/selectors/usersSelectors";
import type { IUser } from "@/interfaces/models/user";

const User: React.FC = () => {
  const pathParts: string[] = usePathname()?.split("/") ?? [""];
  const userId: string = pathParts[pathParts.length - 1];

  const user: IUser | undefined = useGetUserById(userId);

  return (
    <div>
      <h1 className="text-xl">{user?.username}</h1>
    </div>
  );
};

export default User;
