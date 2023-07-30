import Link from "next/link";

import DarkModeToggle from "./components/darkModeToggle";
import PokeballSvg from "../assets/pokeballSvg";
import SearchBar from "./components/searchBar";

const Header: React.FC = () => {
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
        {/* <UserMenu /> */}
      </div>
    </header>
  );
};

export default Header;
