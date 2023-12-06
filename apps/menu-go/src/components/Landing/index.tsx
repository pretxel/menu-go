/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="bg-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 pt-14">
        <div
          className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-6 py-4 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
            <h1
              className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:col-span-2 xl:col-auto"
              suppressHydrationWarning
            >
              {t('home.info_section.title', { ns: 'common' })}
            </h1>
            <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
              <p
                className="text-lg leading-8 text-gray-600"
                suppressHydrationWarning
              >
                {t('home.info_section.description', { ns: 'common' })}
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/login"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  suppressHydrationWarning
                >
                  {t('home.buttons_section.button1', { ns: 'common' })}
                </Link>
                <Link
                  href="/learn"
                  className="text-sm font-semibold leading-6 text-gray-900"
                  suppressHydrationWarning
                >
                  {t('home.buttons_section.button2', { ns: 'common' })}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <img
              src="https://www.techguide.com.au/wp-content/uploads/2020/11/QRCode1-750x400.jpeg"
              alt=""
              className="mt-10 aspect-[6/5] w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36"
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white sm:h-32" />
      </div>
    </div>
  );
}
