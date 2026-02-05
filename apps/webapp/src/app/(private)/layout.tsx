import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

import { auth } from "@webapp/auth";
import { LayoutWrapper } from "@webapp/components/layout";

import { HeaderPrivate, SidebarPrivate } from "./_components/layout";

export default async function LayoutPrivate({ children }: PropsWithChildren) {
  const session = await auth();
  if (!session) redirect("/unauthorized");

  return (
    <LayoutWrapper header={<HeaderPrivate />} sidebar={<SidebarPrivate />}>
      {children}
    </LayoutWrapper>
  );
}
