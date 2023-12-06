import type { NextPage } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';

import Learn from '../../components/Learn';

export const getServerSideProps = async (context) => {
  const { locale } = context;

  return {
    props: {
      ...(await serverSideTranslations(locale as string, ['common', 'learn'])),
    },
  };
};

const Home: NextPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>{t('tab_title', { ns: 'learn' })}</title>
        <meta
          name="description"
          content={t('tab_description', { ns: 'common' })}
        />
        <link rel="icon" href="/favicon.ico" />
        <meta property="twitter:image" content="/api/og" />
      </Head>

      <Learn />
    </>
  );
};

export default Home;
