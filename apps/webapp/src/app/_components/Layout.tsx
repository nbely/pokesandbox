import type { PropsWithChildren } from "react";

import { Header } from "./header/Header";
import { Sidebar } from "./sidebar/Sidebar";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex">
      <Header />
      <main
        className="fixed top-16 left-16 border-t-2 m-0 p-4
          h-[calc(100vh-4rem)] w-[calc(100vw-4rem)]
          bg-gray-100 text-gray-800 border-gray-500 
          dark:bg-gray-1100 dark:text-gray-100 dark:border-gray-1200"
      >
        {children}
      </main>
      <Sidebar />
    </div>
  );
}
