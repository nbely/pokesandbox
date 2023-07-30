import { Provider } from "react-redux";

import { store } from "@/store";

import ThemeProvider from "./themeProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {

  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
}

export default Providers;