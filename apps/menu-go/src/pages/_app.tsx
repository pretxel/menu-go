import 'focus-visible';
import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import i18n from '../utils/configs/i18n';
import { store } from '../utils/redux/store';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <Provider store={store}>
      <SessionProvider session={session}>
        <I18nextProvider i18n={i18n}>
          <Component {...pageProps} />
          <Analytics />
        </I18nextProvider>
      </SessionProvider>
    </Provider>
  );
}

export default MyApp;
