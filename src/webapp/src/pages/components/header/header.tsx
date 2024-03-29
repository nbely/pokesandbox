import Link from "next/link";

import DarkModeToggle from "./components/darkModeToggle";
import { IState, useGlobalContext } from "@/context/globalProvider";
import PokeballSvg from "../assets/pokeballSvg";
import SearchBar from "./components/searchBar";

export default function Header(): JSX.Element {
  const state: IState = useGlobalContext();
  return (
    <header
      className="fixed top-0 left-16 h-16 w-[calc(100vw-4rem)] m-0 px-4 
        flex flex-row justify-between items-center shadow
        bg-gray-100 text-gray-900 
        dark:bg-gray-1100 dark:text-gray-500"
    >
      <Link
        href="/"
        className="relative flex items-center justify-center
          h-8 w-auto my-auto
          hover:text-gold-800 dark:hover:text-dgold-700
          transition-all duration-100 ease-linear
          cursor-pointer"
      >
        <PokeballSvg className="mr-2 text-gold-800 dark:text-dgold-700" />
        <span className="text-xl">PokéSandbox</span>
      </Link>
      <div className="flex flex-row items-center space-x-4">
        <SearchBar />
        <DarkModeToggle />
      </div>
    </header>
  );
}