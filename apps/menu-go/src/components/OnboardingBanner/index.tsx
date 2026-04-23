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
    { label: 'Add category', done: hasCategory, href: '/panel/categories' },
    { label: 'Add dishes', done: hasDish, href: '/panel/onboarding/dishes' },
    { label: 'Share QR', done: false, href: '#qr-section' },
  ];

  const activeIdx = steps.findIndex((s) => !s.done);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-indigo-50 border-b-2 border-indigo-200 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">GET STARTED</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isLocked = !step.done && idx > activeIdx;
          const pillClass = [
            'px-3 py-1 rounded-full text-xs font-semibold',
            step.done ? 'bg-green-500 text-white' : '',
            isActive ? 'bg-indigo-600 text-white shadow' : '',
            isLocked ? 'bg-gray-200 text-gray-400' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const pillText = step.done
            ? `✓ ${step.label}`
            : isActive
              ? `→ ${step.label}`
              : step.label;

          return (
            <span key={step.label} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-indigo-200 text-xs">›</span>}
              {step.href && !isLocked ? (
                <Link href={step.href} className={pillClass}>
                  {pillText}
                </Link>
              ) : (
                <span className={pillClass}>{pillText}</span>
              )}
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-xs text-indigo-400 hover:text-indigo-600"
      >
        Dismiss ×
      </button>
    </div>
  );
}
