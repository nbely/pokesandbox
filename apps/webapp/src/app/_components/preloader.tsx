"use client";

import { useEffect, useRef } from "react";

import { setRegions } from "@webapp/store/regionsSlice";
import { setServers } from "@webapp/store/serversSlice";
import { setUsers } from "@webapp/store/usersSlice";
import { store } from "@webapp/store/index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Preloader = ({ data }: any) => {
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && data) {
      store.dispatch(setRegions(data.regions));
      store.dispatch(setServers(data.servers));
      store.dispatch(setUsers(data.users));
      loaded.current = true;
    }
  }, [data]);

  return null;
};

export default Preloader;
