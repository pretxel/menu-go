import 'focus-visible';
import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';

import AnalyticsWeb from '../components/Analytics';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <AnalyticsWeb />
      <Analytics />
    </SessionProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default appWithTranslation(MyApp) as any;
