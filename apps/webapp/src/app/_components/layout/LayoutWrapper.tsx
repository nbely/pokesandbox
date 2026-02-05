import type { PropsWithChildren, ReactNode } from "react";

interface LayoutWrapperProps extends PropsWithChildren {
  header: ReactNode;
  sidebar: ReactNode;
}

export function LayoutWrapper({
  children,
  header,
  sidebar,
}: Readonly<LayoutWrapperProps>) {
  return (
    <div className="flex">
      {header}
      <main
        className="fixed top-16 left-16 border-t-2 m-0 p-4
          h-[calc(100vh-4rem)] w-[calc(100vw-4rem)]
          bg-gray-100 text-gray-800 border-gray-500 
          dark:bg-gray-1100 dark:text-gray-100 dark:border-gray-1200"
      >
        {children}
      </main>
      {sidebar}
    </div>
  );
}
