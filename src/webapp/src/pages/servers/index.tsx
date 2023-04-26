import Link from "next/link";

export default function Servers(): JSX.Element {

  return (
    <div>
      <h1 className="text-xl">Servers:</h1>
      <br />
      <Link href="/servers/turquoise" className="text-blue-700 dark:text-blue-400">
        Pokémon Turquoise
      </Link>
    </div>
  )
}