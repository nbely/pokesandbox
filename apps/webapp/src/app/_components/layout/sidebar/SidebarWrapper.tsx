import type { PropsWithChildren } from "react";

import { SidebarButton } from "./SidebarButton";

export const SidebarWrapper = ({ children }: PropsWithChildren) => (
  <aside
    className="fixed top-0 left-0 h-screen w-16 m-0
        flex flex-col border-r-2 shadow
        bg-gray-400 text-gray-900 border-gray-500
        dark:bg-gray-1200 dark:text-gray-100 dark:border-gray-1200"
  >
    <SidebarButton label="Server Discovery" route="servers" />
    <hr className="w-12 mx-auto border-t-2 border-gray-500 dark:border-gray-1000" />
    {children}
  </aside>
);
