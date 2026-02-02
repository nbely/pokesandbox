"use client";

import { Button } from "antd";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

import PokeballSvg from "../assets/pokeballSvg";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { SearchBar } from "./components/SearchBar";

export const Header = () => {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  return (
    <header
      className="fixed top-0 left-16 h-16 w-[calc(100vw-4rem)] m-0 px-4 
        flex flex-row justify-between items-center shadow
        bg-gray-100 text-gray-900 
        dark:bg-gray-1100 dark:text-gray-500"
    >
      <Link
        href="/"
        className="Link relative flex items-center justify-center
          h-8 w-auto my-auto"
      >
        <PokeballSvg className="mr-2 text-gold-800 dark:text-dgold-700" />
        <span className="text-xl">PokéSandbox</span>
      </Link>
      <div className="flex flex-row items-center space-x-4">
        <SearchBar />
        <DarkModeToggle />
        <Button
          loading={loading}
          className="min-h-[40px]"
          onClick={() => {
            if (!session) return signIn();
            return signOut();
          }}
        >
          {session ? "Logout" : "Login"}
        </Button>
      </div>
    </header>
  );
};
