import Head from 'next/head';
import { PropsWithChildren } from "react";

import { PokeballSvg } from './svgLibrary';
import SearchBar from './searchBar';
import styles from './layout.module.scss';
import Link from 'next/link';
import Image from 'next/image';

export const siteTitle = 'Next.js Sample Website';

export default function Layout({ children }: PropsWithChildren): JSX.Element {
    return (
        <div className="flex">
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta
                    name="description"
                    content="Learn how to build a personal website using Next.js"
                />
                <meta name="og:title" content={siteTitle} />
            </Head>
            <header className="fixed top-0 left-16 h-16 w-screen m-0
                               flex flex-row
                               bg-gray-100 text-gray-900 shadow
                               dark:bg-gray-800 dark:text-gray-100"
            >
                <Link href="/" className="nav-link">
                    <PokeballSvg className="mr-4" />
                    PokéSandbox
                </Link>
                <div className="App-search-bar">
                    <SearchBar />
                </div>
            </header>
            <main className="fixed top-16 left-16 h-screen w-screen m-0
                             bg-gray-100 text-gray-800 shadow
                             dark:bg-gray-800 dark:text-bg-gray-100"
            >
                {children}
            </main>
            <aside className="fixed top-0 left-0 h-screen w-16 m-0
                              flex flex-col
                              bg-white text-gray-900 shadow
                              dark:bg-gray-900 dark:text-white"
            >
                Aside
            </aside>
        </div>
    );
}