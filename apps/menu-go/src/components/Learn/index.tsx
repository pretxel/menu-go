/* eslint-disable @next/next/no-img-element */
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
export default function Learn() {
  const { t } = useTranslation();
  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1
          className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          suppressHydrationWarning
        >
          {t('title', { ns: 'learn' })}
        </h1>
        <p
          className="mt-6 text-xl leading-8 text-pretty"
          suppressHydrationWarning
        >
          {t('description', { ns: 'learn' })}
        </p>
        <div className="mt-10 max-w-2xl">
          <h2
            className="mt-16 text-2xl font-bold tracking-tight text-gray-900"
            suppressHydrationWarning
          >
            {t('create-account', { ns: 'learn' })}
          </h2>
          <figure className="mt-16">
            <Image
              className="rounded-xl bg-gray-50 object-cover"
              src="/images/learn/create-account.webp"
              alt="create your account"
              width={600}
              height={300}
            />
            <figcaption
              className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500"
              suppressHydrationWarning
            >
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                aria-hidden="true"
              />
              {t('create-account-info', { ns: 'learn' })}
            </figcaption>
          </figure>

          <h2
            className="mt-16 text-2xl font-bold tracking-tight text-gray-900"
            suppressHydrationWarning
          >
            {t('configure-restaurant', { ns: 'learn' })}
          </h2>
          <figure className="mt-16">
            <img
              className="rounded-xl bg-gray-50 object-fill"
              src="/images/learn/restaurant-details.webp"
              alt="restaurant details"
            />
            <figcaption
              className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500"
              suppressHydrationWarning
            >
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                aria-hidden="true"
              />
              {t('configure-restaurant-info', { ns: 'learn' })}
            </figcaption>
          </figure>

          <h2
            className="mt-16 text-2xl font-bold tracking-tight text-gray-900"
            suppressHydrationWarning
          >
            {t('create-menu', { ns: 'learn' })}
          </h2>
          <p className="mt-8 text-pretty" suppressHydrationWarning>
            {t('create-menu-p', { ns: 'learn' })}
          </p>
          <figure className="mt-16">
            <img
              className="rounded-xl bg-gray-50 object-fill"
              src="/images/learn/menu.webp"
              alt="menu created"
            />
            <figcaption
              className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500"
              suppressHydrationWarning
            >
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                aria-hidden="true"
              />
              {t('create-menu-info', { ns: 'learn' })}
            </figcaption>
          </figure>

          <h2
            className="mt-16 text-2xl font-bold tracking-tight text-gray-900"
            suppressHydrationWarning
          >
            {t('preview-menu', { ns: 'learn' })}
          </h2>

          <figure className="mt-16">
            <img
              className="rounded-xl bg-gray-50 object-fill"
              src="/images/learn/menu-qr.webp"
              alt="menu qr example"
            />
            <figcaption
              className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500"
              suppressHydrationWarning
            >
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                aria-hidden="true"
              />
              {t('preview-menu-info', { ns: 'learn' })}
            </figcaption>
          </figure>
          <figure className="mt-16">
            <img
              className="rounded-xl bg-gray-50 object-fill"
              src="/images/learn/menu-preview.webp"
              alt="menu preview"
            />
            <figcaption
              className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500"
              suppressHydrationWarning
            >
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                aria-hidden="true"
              />
              {t('preview-menu-info-2', { ns: 'learn' })}
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
