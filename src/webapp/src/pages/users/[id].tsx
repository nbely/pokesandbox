import { useRouter } from "next/router";

import { useGetUserById } from "@/store/selectors/usersSelectors";

import type { IUser } from "@/interfaces/models/user";

const User: React.FC = () => {
  const router = useRouter();
  let user: IUser | undefined =
    typeof router.query.id === "string"
      ? useGetUserById(router.query.id)
      : undefined;

  return (
    <div>
      <h1 className="text-xl">{user?.username}</h1>
    </div>
  );
};

export default User;
