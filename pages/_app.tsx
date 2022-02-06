import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import { store } from '../utils/redux/store'
import { I18nextProvider } from 'react-i18next'
import i18n from '../utils/configs/i18n'
import 'antd/dist/antd.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <Component {...pageProps} />
      </I18nextProvider>
    </Provider>
  )
}

export default MyApp
