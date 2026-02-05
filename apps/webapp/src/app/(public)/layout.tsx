import type { PropsWithChildren } from "react";

import { LayoutWrapper } from "@webapp/components/layout";

import { HeaderPublic, SidebarPublic } from "./_components/layout";

export default function LayoutPublic({ children }: PropsWithChildren) {
  return (
    <LayoutWrapper header={<HeaderPublic />} sidebar={<SidebarPublic />}>
      {children}
    </LayoutWrapper>
  );
}
