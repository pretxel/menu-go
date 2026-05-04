import type { NextPage } from 'next';
import Head from 'next/head';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

import Learn from '../../components/Learn';

export const getStaticProps = async (context) => {
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
