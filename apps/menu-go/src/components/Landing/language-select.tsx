'use client';
import { useRouter } from 'next/router';
import { useState } from 'react';

import EnglishItem from './english-item';
import SpanishItem from './spanish-item';
export default function LanguageSelect({ locale }) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  return (
    <div className="z-50 flex items-center space-x-1 md:order-2 md:space-x-0 text-end">
      <div className="relative font-[sans-serif] w-full px-10">
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="px-6 py-2.5 rounded text-[#333] text-sm font-semibold border-2 border-blue-600 outline-none hover:bg-blue-50"
        >
          <div className="flex items-center">
            {locale === 'en' ? <EnglishItem /> : <SpanishItem />}
          </div>
        </button>
        <ul
          className={`absolute shadow-lg bg-white py-2 px-2 z-[1000]  w-max rounded max-h-96 overflow-auto top-12 right-10 ${
            !show ? 'hidden' : ''
          }`}
          onClick={() => {
            if (locale === 'es') {
              router.push('/', '/', { locale: 'en' });
            } else {
              router.push('/', '/', { locale: 'es' });
            }
          }}
        >
          <li className="py-2.5 px-4 hover:bg-blue-50 text-black text-sm cursor-pointer">
            <div className="flex items-center">
              {locale === 'en' ? <SpanishItem /> : <EnglishItem />}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
