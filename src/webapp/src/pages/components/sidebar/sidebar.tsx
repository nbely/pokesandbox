import SidebarIcon from "./components/sidebarIcon";
import { useGlobalContext } from "@/context/globalProvider";

const Sidebar: React.FC = () => {
  const { getServersByIds, getUser } = useGlobalContext();
  const user = getUser();
  const servers = getServersByIds(user?.servers ?? []);

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-16 m-0
        flex flex-col border-r-2 shadow
        bg-gray-400 text-gray-900 border-gray-500
        dark:bg-gray-1200 dark:text-gray-100 dark:border-gray-1200"
    >
      <SidebarIcon label="Server Discovery" route="servers" />
      <hr className="w-12 mx-auto border-t-2 border-gray-500 dark:border-gray-1000" />
      {servers.map((server) => {
        const iconUrl: string | undefined = server.discovery.icon
          ? `https://cdn.discordapp.com/icons/${server.serverId}/${server.discovery.icon}.png`
          : undefined;

        return (
          <SidebarIcon
            iconUrl={iconUrl}
            label={server.name}
            route={`servers/${server.serverId}`}
          />
        );
      })}
    </aside>
  );
};

export default Sidebar;
