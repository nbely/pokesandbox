import Link from "next/link";

export default function Server(): JSX.Element {

  return (
    <div>
      <h1 className="text-xl">Players:</h1>
      <br />
      <Link href="/profiles/chron" className="text-blue-700 dark:text-blue-400">
        Chron
      </Link>
    </div>
  )
}