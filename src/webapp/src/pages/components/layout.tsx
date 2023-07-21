import Head from "next/head";
import { PropsWithChildren } from "react";

import Header from "./header/header";
import Sidebar from "./sidebar/sidebar";
import { useGlobalContext } from "@/context/globalProvider";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const { isDarkMode } = useGlobalContext();
  return (
    <div className={`flex ${isDarkMode ? "dark" : ""}`}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta name="og:title" content="PokeSandbox" />
      </Head>
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
};

export default Layout;
