import 'focus-visible';
import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { Provider } from 'react-redux';

import AnalyticsWeb from '../components/Analytics';
import { store } from '../utils/redux/store';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <Provider store={store}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
        <AnalyticsWeb />
        <Analytics />
      </SessionProvider>
    </Provider>
  );
}

export default appWithTranslation(MyApp);
