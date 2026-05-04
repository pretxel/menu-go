'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'onboarding-dismissed';

type Step = {
  label: string;
  done: boolean;
  href: string | null;
};

type Props = {
  hasCategory: boolean;
  hasDish: boolean;
};

export default function OnboardingBanner({ hasCategory, hasDish }: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (dismissed === null || dismissed) return null;

  const steps: Step[] = [
    { label: 'Profile', done: true, href: null },
    { label: 'Category', done: hasCategory, href: '/panel/categories' },
    { label: 'Dishes', done: hasDish, href: '/panel/onboarding/dishes' },
    { label: 'Share QR', done: false, href: '#qr-section' },
  ];

  const activeIdx = steps.findIndex((s) => !s.done);
  const completed = steps.filter((s) => s.done).length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="card-brut mb-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b-3 border-ink bg-mustard px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center border-2 border-ink bg-paper font-display text-xs font-extrabold">
            {completed}/{steps.length}
          </span>
          <span className="font-display text-sm font-extrabold uppercase tracking-tight">
            Get started
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="border-2 border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-ink hover:text-paper"
        >
          Dismiss ×
        </button>
      </div>

      <ol className="grid grid-cols-2 divide-y-3 divide-ink sm:grid-cols-4 sm:divide-x-3 sm:divide-y-0">
        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isLocked = !step.done && idx > activeIdx;
          const num = String(idx + 1).padStart(2, '0');

          const content = (
            <div
              className={`relative flex h-full flex-col gap-1 p-4 transition-colors ${
                step.done
                  ? 'bg-lime'
                  : isActive
                    ? 'bg-tomato text-paper'
                    : 'bg-paper'
              } ${!isLocked && step.href ? 'hover:bg-ink hover:text-paper' : ''}`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                Step {num}
              </span>
              <span className="font-display text-base font-extrabold tracking-tight">
                {step.label}
              </span>
              <span className="mt-auto font-mono text-[10px] font-bold uppercase tracking-widest">
                {step.done ? '✓ Done' : isActive ? '→ Now' : isLocked ? 'Locked' : 'Open'}
              </span>
            </div>
          );

          return (
            <li key={step.label} className="block">
              {step.href && !isLocked ? (
                <Link href={step.href} className="block h-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
