'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PhotoMenuImporter from './index';

export default function ImportHeroPage() {
  const router = useRouter();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-paper px-4 py-12 sm:px-6">
      {/* decorative shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 right-[10%] h-32 w-32 rotate-12 border-3 border-ink bg-lime shadow-brut-lg"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-12 left-[6%] hidden h-20 w-20 rounded-full border-3 border-ink bg-mustard shadow-brut-sm md:block"
      />

      <div className="relative mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-2 border-3 border-ink bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] shadow-brut-sm">
          <span className="h-2 w-2 rounded-full bg-tomato" />
          Onboarding · 02 of 04
        </span>

        <h1 className="mt-6 font-display text-[clamp(2.2rem,6vw,3.5rem)] font-extrabold leading-[0.95] tracking-tight">
          Snap your <span className="bg-tomato px-2 text-paper">paper menu</span>.
          <br /> We do the typing.
        </h1>
        <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-ink/70 sm:text-base">
          Drop a photo, drag a JPEG, or take one with your phone. Every dish, name,
          and price — extracted in seconds.
        </p>

        <div className="mt-10">
          <PhotoMenuImporter
            alwaysOpen
            onImportSuccess={() => router.push('/panel/dishes')}
          />
        </div>

        <div className="mt-8 flex items-center justify-between border-t-3 border-dashed border-ink/30 pt-6">
          <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
            Prefer typing?
          </span>
          <Link
            href="/panel/dishes"
            className="font-mono text-xs font-bold uppercase tracking-widest underline-offset-4 hover:underline"
          >
            Add dishes manually →
          </Link>
        </div>
      </div>
    </div>
  );
}
