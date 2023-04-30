import SidebarIcon from "./components/sidebarIcon";

const Sidebar: React.FC = () => {

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-16 m-0
        flex flex-col border-r-2 shadow
        bg-gray-400 text-gray-900 border-gray-500
        dark:bg-gray-1200 dark:text-gray-100 dark:border-gray-1200"
    >
      <SidebarIcon label="SD" route="servers" />
      <hr className="w-12 mx-auto border-t-2 border-gray-500 dark:border-gray-1000" />
      <SidebarIcon label="PT" route="servers/turquoise" />
    </aside>
  );
}

export default Sidebar;
