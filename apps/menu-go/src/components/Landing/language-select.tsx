'use client';
import { useRouter } from 'next/router';
import { useState } from 'react';

import EnglishItem from './english-item';
import SpanishItem from './spanish-item';

export default function LanguageSelect({ locale }) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="inline-flex items-center gap-2 border-3 border-ink bg-paper px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-brut-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut"
      >
        <div className="flex items-center">
          {locale === 'en' ? <EnglishItem /> : <SpanishItem />}
        </div>
        <span aria-hidden>▾</span>
      </button>
      {show && (
        <ul
          className="absolute right-0 top-12 z-50 w-max border-3 border-ink bg-paper shadow-brut"
          onClick={() => {
            if (locale === 'es') {
              router.push('/', '/', { locale: 'en' });
            } else {
              router.push('/', '/', { locale: 'es' });
            }
          }}
        >
          <li className="cursor-pointer border-b-3 border-ink px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-lime last:border-b-0">
            <div className="flex items-center">
              {locale === 'en' ? <SpanishItem /> : <EnglishItem />}
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}
