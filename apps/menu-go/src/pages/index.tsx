import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

import Landing from '../components/Landing';

export const getStaticProps = async (context) => {
  const { locale } = context;

  return {
    props: {
      locale,
      ...(await serverSideTranslations(locale as string, ['common'])),
    },
  };
};

const Home = ({ locale }) => {
  return (
    <>
      <Head>
        <title>Dineqrs</title>
        <meta
          name="description"
          content="Digitize and manage your business's digital menu, share on social media, analyze your data, and utilize the QR code."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta
          property="twitter:image"
          content="https://www.dineqrs.com/api/og"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Dineqrs" />
        <meta
          property="twitter:description"
          content="Digitize and manage your business's digital menu, share on social media, analyze your data, and utilize the QR code."
        />
        <meta property="og:image" content="https://www.dineqrs.com/api/og" />
        <meta property="og:title" content="Dineqrs" />
        <meta
          property="og:description"
          content="Digitize and manage your business's digital menu, share on social media, analyze your data, and utilize the QR code."
        />
        <meta property="og:url" content="https://www.dineqrs.com/" />
        <meta name="google-adsense-account" content="ca-pub-1098294754637557" />
      </Head>
      <Landing locale={locale} />
    </>
  );
};

export default Home;
