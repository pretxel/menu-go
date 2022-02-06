import '../styles/globals.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  let app = ''
  return <Component {...pageProps} />
}

export default MyApp
