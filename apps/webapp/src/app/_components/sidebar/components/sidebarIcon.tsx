"use client";
import Image from "next/image";
import Link from "next/link";

import { getLabelAcronym } from "../utils";

interface ISidebarIconProps {
  iconUrl?: string;
  label: string;
  route: string;
}

const SidebarIcon = ({
  iconUrl,
  label,
  route,
}: ISidebarIconProps) => {
  const labelAcronym: string = getLabelAcronym(label);

  return (
    <Link
      className={`relative flex items-center justify-center
        h-12 w-12 mt-2 mb-2 mx-auto group
        bg-gray-500 text-gold-800
        dark:bg-gray-1000 dark:text-dgold-800
        rounded-3xl hover:rounded-xl
        transition-all duration-300 ease-linear
        cursor-pointer
        ${
          !iconUrl
            ? "hover:bg-gold-800 hover:text-gray-100 dark:hover:bg-dgold-700 dark:hover:text-gray-1300"
            : ""
        }`}
      href={`/${route}`}
    >
      {iconUrl ? (
        <Image
          alt={`${label} sidebar icon link`}
          className="h-10 w-10 rounded-3xl
            group-hover:rounded-xl group-hover:h-11 group-hover:w-11
            transition-all duration-200 ease-linear"
          height={0}
          src={iconUrl}
          width={0}
          sizes="100vw"
        />
      ) : (
        labelAcronym
      )}
    </Link>
  );
};

export default SidebarIcon;
