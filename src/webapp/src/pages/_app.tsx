import { GlobalProvider } from '@/context/globalProvider'
import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import Layout from './components/layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GlobalProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </GlobalProvider>
  );
}
