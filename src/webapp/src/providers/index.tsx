import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";

import { store } from "@/store";

import ThemeProvider from "./themeProvider";

interface ProvidersProps extends React.PropsWithChildren {
  session: any;
}

const Providers = ({ children, session }: ProvidersProps) => {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    </SessionProvider>
  );
};

export default Providers;
