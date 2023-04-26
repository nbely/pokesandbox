import { AppProps } from 'next/app';
import Link from 'next/link';
import React from 'react';

interface ISidebarIconProps {
  label: string,
  route: string
}

export default function SidebarIcon({ label, route }: ISidebarIconProps): JSX.Element {
  return (
    <Link 
      className="relative flex items-center justify-center
        h-12 w-12 mt-2 mb-2 mx-auto
        bg-gray-500 text-gold-800
        dark:bg-gray-1000 dark:text-dgold-800
        hover:bg-gold-800 hover:text-gray-100
        dark:hover:bg-dgold-700 dark:hover:text-gray-1300
        rounded-3xl hover:rounded-xl
        transition-all duration-300 ease-linear
        cursor-pointer"
      href={`/${route}`}
    >
      {label}
    </Link>
  );
}