import { useRouter } from "next/router";

import { IUser } from "@/interfaces/models/user";
import { useGetUserById } from "@/store/selectors/usersSelectors";

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
