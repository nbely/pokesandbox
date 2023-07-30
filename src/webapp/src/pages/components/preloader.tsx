import React, { useRef } from "react";

import { setServers } from "@/store/serversSlice";
import { store } from "@/store";
import { setLoggedInUser, setUsers } from "@/store/usersSlice";
import { setRegions } from "@/store/regionsSlice";

const Preloader = ({ data }: any) => {
  const loaded = useRef(false);

  React.useEffect(() => {
    if (!loaded.current && data) {
      store.dispatch(setRegions(data.regions));
      store.dispatch(setServers(data.servers));
      store.dispatch(setLoggedInUser(data.loggedInUser));
      store.dispatch(setUsers(data.users));
      loaded.current = true;
    }
  }, []);

  return null;
};

export default Preloader;