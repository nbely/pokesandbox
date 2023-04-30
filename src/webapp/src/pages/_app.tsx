import type { AppProps } from 'next/app'

import '@/styles/globals.scss'
import GlobalProvider from '@/context/globalProvider'
import Layout from './components/layout';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  
  return (
    <GlobalProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </GlobalProvider>
  );
};

export default App;
