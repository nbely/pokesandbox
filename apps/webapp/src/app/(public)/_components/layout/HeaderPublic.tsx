"use client";

import { Button } from "antd";
import { signIn, useSession } from "next-auth/react";

import { HeaderWrapper } from "@webapp/components/layout";

export const HeaderPublic = () => {
  const { status } = useSession();
  const loading = status === "loading";

  return (
    <HeaderWrapper
      authButton={
        <Button
          block
          loading={loading}
          onClick={() => signIn("discord")}
          size="large"
        >
          Login
        </Button>
      }
    />
  );
};
