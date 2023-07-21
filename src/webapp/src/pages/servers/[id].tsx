import { useRouter } from "next/router";

import { useGlobalContext } from "@/context/globalProvider";

const Server: React.FC = () => {
  const { getServerById } = useGlobalContext();
  const router = useRouter();
  const server = getServerById(router.query.id as string);

  return (
    <div>
      <h1 className="text-xl">{server?.name}</h1>
      <br />
      <p>{server?.discovery.description}</p>
    </div>
  );
};

export default Server;
