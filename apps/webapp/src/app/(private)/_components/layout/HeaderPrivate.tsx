"use client";

import { Button } from "antd";
import { signOut, useSession } from "next-auth/react";

import { HeaderWrapper } from "@webapp/components/layout";

export const HeaderPrivate = () => {
  const { status } = useSession();
  const loading = status === "loading";

  return (
    <HeaderWrapper
      authButton={
        <Button block loading={loading} onClick={() => signOut()} size="large">
          Logout
        </Button>
      }
    />
  );
};
