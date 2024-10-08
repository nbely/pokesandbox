"use client";
import { Button } from "antd";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@webapp/store/selectors";
import { useGetUserById } from "@webapp/store/selectors/usersSelectors";
import { setLoggedInUser } from "@webapp/store/usersSlice";

import PokeballSvg from "../assets/pokeballSvg";
import DarkModeToggle from "./components/darkModeToggle";
import SearchBar from "./components/searchBar";

const Header = () => {
  const dispatch = useAppDispatch();
  const loggedInUser = useAppSelector((state) => state.users.loggedInUser);
  const { data: session } = useSession();
  const user = useGetUserById(session?.user?.id ?? "");

useEffect(() => {
    if (user && !loggedInUser) {
      dispatch(setLoggedInUser(user));
    }
  }, [dispatch, loggedInUser, user]);

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
        {session ? (
          <Button className="min-h-[40px]" onClick={() => signOut()}>
            Logout
          </Button>
        ) : (
          <Button className="min-h-[40px]" onClick={() => signIn("discord")}>
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
