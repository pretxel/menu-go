import type { NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import LandingHeader from '../landing/header'

const Panel: NextPage = () => {
  const { t } = useTranslation('homeScreen')
  return (
    <>
      <Head>
        <title>{t('title')}</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="hp-landing hp-bg-black-0 hp-bg-dark-90">
        <LandingHeader />
      </div>
    </>
  )
}

export default Panel
