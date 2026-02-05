import { ComponentType } from "react";

import { auth } from "@webapp/auth";

export interface PrivatePageProps {
  userId: string;
}

export type SharedRouteProps<P extends object = Record<string, unknown>> = {
  privatePage: ComponentType<P & PrivatePageProps>;
  props?: P;
  publicPage: ComponentType<P>;
};

export async function SharedPage({
  privatePage,
  props,
  publicPage,
}: SharedRouteProps) {
  const session = await auth();

  if (!session?.user?.id) {
    const PublicPage = publicPage;
    return <PublicPage {...props} />;
  }

  const PrivatePage = privatePage;
  return <PrivatePage {...props} userId={session.user.id} />;
}
