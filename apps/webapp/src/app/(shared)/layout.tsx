import type { PropsWithChildren } from "react";

import { auth } from "@webapp/auth";

import LayoutPrivate from "../(private)/layout";
import LayoutPublic from "../(public)/layout";

export default async function SharedLayout({ children }: PropsWithChildren) {
  const session = await auth();

  if (!session) return <LayoutPublic>{children}</LayoutPublic>;
  return <LayoutPrivate>{children}</LayoutPrivate>;
}
