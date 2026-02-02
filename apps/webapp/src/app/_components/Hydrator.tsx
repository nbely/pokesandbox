"use client";

import { useEffect, useRef } from "react";

import { trpc } from "@webapp/trpc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Hydrator = ({ data }: any) => {
  const utils = trpc.useUtils();
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current && data) {
      utils.regions.getAll.setData(undefined, data.regions);
      utils.servers.getAll.setData(undefined, data.servers);
      utils.users.getAll.setData(undefined, data.users);
      hydrated.current = true;
    }
  }, [data, utils]);

  return null;
};
