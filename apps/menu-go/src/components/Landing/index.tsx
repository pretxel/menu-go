/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';

import LanguageSelect from './language-select';

export default function Landing({ locale }) {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
      {/* top marquee strip */}
      <div className="border-b-3 border-ink bg-ink text-paper overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-2 font-mono text-xs uppercase tracking-widest">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="mx-6 flex items-center gap-6">
              <span>Scan · Order · Eat</span>
              <span className="text-tomato">●</span>
              <span>QR menus, no app required</span>
              <span className="text-lime">▲</span>
              <span>Made for restaurants</span>
              <span className="text-mustard">■</span>
            </span>
          ))}
        </div>
      </div>

      {/* nav */}
      <header className="relative border-b-3 border-ink bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border-3 border-ink bg-tomato text-paper shadow-brut-sm font-display text-xl font-extrabold">
              D
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              DINEQRS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelect locale={locale} />
            <Link href="/login" className="hidden btn-brut text-sm sm:inline-flex">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative">
        {/* decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-[8%] h-32 w-32 rotate-12 border-3 border-ink bg-lime shadow-brut-lg sm:h-44 sm:w-44"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-[2%] h-16 w-16 -rotate-12 rounded-full border-3 border-ink bg-mustard shadow-brut-sm"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[42%] hidden h-20 w-20 border-3 border-ink stripe-bg lg:block"
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:py-24">
          <div className="relative z-10 lg:col-span-7">
            <span className="inline-flex items-center gap-2 border-3 border-ink bg-paper px-3 py-1 font-mono text-xs uppercase tracking-widest shadow-brut-sm">
              <span className="h-2 w-2 rounded-full bg-tomato" />
              QR · MENU · MGMT
            </span>

            <h1
              className="mt-6 font-display text-[clamp(2.6rem,7vw,5.5rem)] font-extrabold leading-[0.92] tracking-tight"
              suppressHydrationWarning
            >
              <span className="block">{t('home.info_section.title', { ns: 'common' })}</span>
              <span className="mt-2 inline-block bg-tomato px-3 text-paper -rotate-1 shadow-brut-lg">
                no apps.
              </span>
            </h1>

            <p
              className="mt-8 max-w-xl font-mono text-base leading-relaxed text-ink/80 sm:text-lg"
              suppressHydrationWarning
            >
              {t('home.info_section.description', { ns: 'common' })}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/d"
                className="btn-brut-primary text-base"
                suppressHydrationWarning
              >
                {t('home.buttons_section.button1', { ns: 'common' })}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/learn"
                className="btn-brut text-base"
                suppressHydrationWarning
              >
                {t('home.buttons_section.button2', { ns: 'common' })}
              </Link>
            </div>

            {/* stat row */}
            <dl className="mt-12 grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: '0', v: 'apps to install' },
                { k: '60s', v: 'to publish' },
                { k: '∞', v: 'updates / day' },
              ].map((s) => (
                <div
                  key={s.v}
                  className="border-3 border-ink bg-paper p-3 shadow-brut-sm"
                >
                  <dt className="font-display text-3xl font-extrabold leading-none">
                    {s.k}
                  </dt>
                  <dd className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/70">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* image card */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md rotate-2 transition-transform duration-300 hover:rotate-0">
              <div className="card-brut overflow-hidden">
                <div className="flex items-center justify-between border-b-3 border-ink bg-lime px-4 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-ink bg-tomato" />
                    <span className="h-3 w-3 rounded-full border-2 border-ink bg-mustard" />
                    <span className="h-3 w-3 rounded-full border-2 border-ink bg-paper" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    /your-menu.qr
                  </span>
                </div>
                <div className="relative aspect-5/6">
                  <Image
                    fill
                    src="/images/home/home-qr.webp"
                    alt="home-qr-image"
                    className="object-cover"
                  />
                </div>
              </div>
              {/* sticker badge */}
              <div className="absolute -bottom-6 -left-6 grid h-24 w-24 place-items-center rounded-full border-3 border-ink bg-mustard text-center font-display text-xs font-extrabold uppercase shadow-brut-lg animate-sticker">
                <span>
                  Scan
                  <br />
                  Me
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* feature strip */}
      <section className="border-y-3 border-ink bg-bone">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y-3 divide-ink sm:grid-cols-3 sm:divide-x-3 sm:divide-y-0">
          {[
            { n: '01', h: 'Snap menu', p: 'Photo of your paper menu. We extract every dish.' },
            { n: '02', h: 'Print QR', p: 'One QR for every table. Customers scan, browse, order.' },
            { n: '03', h: 'Edit live', p: 'Sold out? Edit price? It updates everywhere instantly.' },
          ].map((f) => (
            <div key={f.n} className="px-6 py-8 sm:px-8 sm:py-10">
              <span className="font-mono text-xs uppercase tracking-widest text-tomato">
                {f.n}
              </span>
              <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                {f.h}
              </h3>
              <p className="mt-2 font-mono text-sm leading-relaxed text-ink/70">
                {f.p}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t-3 border-ink bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-10">
          <p className="font-mono text-xs uppercase tracking-widest">
            © Dineqrs — built for hungry restaurants
          </p>
          <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
            <Link href="/learn" className="hover:underline">
              Learn
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/login" className="hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
