import { BasketProvider } from '@/edoctor/Basket';
import type { AppProps } from 'next/app';
import '@/styles/edoctor.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <BasketProvider>
      <Component {...pageProps} />
    </BasketProvider>
  );
}

export default MyApp;
