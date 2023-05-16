import 'focus-visible';
import '../styles/globals.css';
import { Provider } from 'react-redux';
import type { AppProps } from 'next/app';
import { store } from '../utils/redux/store';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/configs/i18n';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <Provider store={store}>
      <SessionProvider session={session}>
        <I18nextProvider i18n={i18n}>
          <Component {...pageProps} />
        </I18nextProvider>
      </SessionProvider>
    </Provider>
  );
}

export default MyApp;
