/* eslint-disable @next/next/no-img-element */
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';

export default function Learn() {
  const { t } = useTranslation();

  const sections = [
    { key: 'create-account', img: '/images/learn/create-account.webp', infoKey: 'create-account-info' },
    { key: 'configure-restaurant', img: '/images/learn/restaurant-details.webp', infoKey: 'configure-restaurant-info' },
    { key: 'create-menu', img: '/images/learn/menu.webp', infoKey: 'create-menu-info', pKey: 'create-menu-p' },
    { key: 'preview-menu', img: '/images/learn/menu-qr.webp', infoKey: 'preview-menu-info' },
    { key: 'preview-menu-2', img: '/images/learn/menu-preview.webp', infoKey: 'preview-menu-info-2' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <header className="border-b-3 border-ink bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border-3 border-ink bg-tomato text-paper shadow-brut-sm font-display text-xl font-extrabold">
              D
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              DINEQRS
            </span>
          </Link>
          <Link href="/" className="font-mono text-xs uppercase tracking-widest hover:underline">
            ← Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-24">
        <span className="inline-flex items-center gap-2 border-3 border-ink bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] shadow-brut-sm">
          <span className="h-2 w-2 rounded-full bg-mustard" />
          Manual · 4 chapters
        </span>
        <h1
          className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight"
          suppressHydrationWarning
        >
          {t('title', { ns: 'learn' })}
        </h1>
        <p
          className="mt-6 max-w-2xl font-mono text-base leading-relaxed text-ink/70 sm:text-lg"
          suppressHydrationWarning
        >
          {t('description', { ns: 'learn' })}
        </p>

        <div className="mt-16 space-y-20">
          {sections.map((s, idx) => (
            <section key={s.key} className="relative">
              <div className="flex items-baseline gap-4 border-b-3 border-ink pb-4">
                <span className="font-mono text-sm font-bold text-ink/40">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h2
                  className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
                  suppressHydrationWarning
                >
                  {t(s.key, { ns: 'learn' })}
                </h2>
              </div>

              {s.pKey && (
                <p className="mt-6 font-mono text-base leading-relaxed text-ink/80" suppressHydrationWarning>
                  {t(s.pKey, { ns: 'learn' })}
                </p>
              )}

              <figure className="mt-8">
                <div className="card-brut overflow-hidden">
                  {idx === 0 ? (
                    <Image
                      src={s.img}
                      alt={s.key}
                      width={800}
                      height={500}
                      className="block w-full object-cover"
                    />
                  ) : (
                    <img src={s.img} alt={s.key} className="block w-full object-cover" />
                  )}
                </div>
                <figcaption className="mt-3 flex items-start gap-2 font-mono text-xs leading-relaxed text-ink/60" suppressHydrationWarning>
                  <InformationCircleIcon className="mt-0.5 h-4 w-4 flex-none text-tomato" aria-hidden="true" />
                  {t(s.infoKey, { ns: 'learn' })}
                </figcaption>
              </figure>
            </section>
          ))}
        </div>

        <div className="mt-24 border-t-3 border-ink pt-10">
          <div className="card-brut bg-lime p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/70">
              Ready
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
              Print your QR. Open your doors.
            </p>
            <Link href="/d" className="btn-brut-primary mt-6 text-sm">
              Try the demo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
