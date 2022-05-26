// import type { NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import VerticalLayout from '../../components/Layout/VerticalLayout'
import { getSession } from 'next-auth/react'

function Panel() {
    const { t } = useTranslation('homeScreen')
    return (
        <>
            <Head>
                <title>{t('panel_title')}</title>
                <meta name="description" content="" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="hp-landing hp-bg-black-0 hp-bg-dark-90">
                <VerticalLayout>
                    <h1>Welcome</h1>
                </VerticalLayout>
            </div>
        </>
    )
}

export async function getServerSideProps(context: any) {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {
        props: { session },
    }
}

export default Panel
