import type { NextPage } from 'next';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';

import Landing from '../components/Landing';

const Home: NextPage = () => {
  const { t } = useTranslation('homeScreen');
  return (
    <>
      <Head>
        <title>{t('home')}</title>
        <meta
          name="description"
          content="Genera menús de restaurantes personalizados y modernos en línea con nuestra herramienta fácil de usar. Crea códigos QR únicos para cada plato y facilita a tus clientes el acceso instantáneo a tu menú desde sus dispositivos móviles. Simplifica la experiencia gastronómica con nuestra plataforma, diseñada para restaurantes que buscan innovar y mejorar la accesibilidad. ¡Haz que tus platos destaquen y atrae a más clientes hoy mismo"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Landing />
    </>
  );
};

export default Home;
