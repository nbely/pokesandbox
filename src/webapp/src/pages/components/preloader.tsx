import React, { useRef } from "react";

import { setRegions } from "@/store/regionsSlice";
import { setServers } from "@/store/serversSlice";
import { setUsers } from "@/store/usersSlice";
import { store } from "@/store";

const Preloader = ({ data }: any) => {
  const loaded = useRef(false);

  React.useEffect(() => {
    if (!loaded.current && data) {
      store.dispatch(setRegions(data.regions));
      store.dispatch(setServers(data.servers));
      store.dispatch(setUsers(data.users));
      loaded.current = true;
    }
  }, []);

  return null;
};

export default Preloader;
