import 'focus-visible';
import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
// eslint-disable-next-line camelcase
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next/pages';

import AnalyticsWeb from '../components/Analytics';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const mono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <div className={`${display.variable} ${mono.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
      <AnalyticsWeb />
      <Analytics />
    </SessionProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default appWithTranslation(MyApp) as any;
