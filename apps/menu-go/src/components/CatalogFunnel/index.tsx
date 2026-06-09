'use client';

import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { parseMenuFromPhoto,publishCatalog } from '../../app/actions';
import {
  clearFunnelState,
  loadFunnelState,
  type ParsedCategory,
  saveFunnelState,
} from '../../lib/funnel-storage';

type Step = 'photo' | 'extracting' | 'preview' | 'details' | 'publishing' | 'success';

type PublishResult = { slug: string; qrCode: string; menuUrl: string };

const STEP_LABELS: Array<{ key: string; label: string }> = [
  { key: 'photo', label: 'Photo' },
  { key: 'preview', label: 'Review' },
  { key: 'details', label: 'Details' },
  { key: 'success', label: 'Share' },
];

function stepIndex(step: Step): number {
  if (step === 'photo' || step === 'extracting') return 0;
  if (step === 'preview') return 1;
  if (step === 'details' || step === 'publishing') return 2;
  return 3;
}

export default function CatalogFunnel() {
  const [step, setStep] = useState<Step>('photo');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [categories, setCategories] = useState<ParsedCategory[] | null>(null);
  const [restaurant, setRestaurant] = useState({ name: '', address: '', phone: '' });
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runExtraction = useCallback(async (image: string) => {
    setStep('extracting');
    setError(null);
    try {
      const parsed = await parseMenuFromPhoto(image);
      if (parsed?.categories?.length) {
        setCategories(parsed.categories);
        setStep('preview');
      } else {
        setError('Could not extract menu items. Try a clearer photo.');
        setStep('photo');
      }
    } catch {
      // Most likely an expired session (server actions mask error details) —
      // re-check and route through sign-in with state preserved.
      const session = await getSession();
      if (!session) {
        saveFunnelState({ step: 'extract', imageBase64: image });
        await signIn(undefined, { callbackUrl: '/d' });
        return;
      }
      setError('Failed to parse menu photo. Please try again.');
      setStep('photo');
    }
  }, []);

  // Restore funnel state after the sign-in round-trip.
  useEffect(() => {
    const saved = loadFunnelState();
    if (!saved) return;
    if (saved.imageBase64) setImageBase64(saved.imageBase64);
    if (saved.categories?.length) setCategories(saved.categories);
    if (saved.restaurant) setRestaurant(saved.restaurant);

    if (saved.step === 'extract') {
      if (saved.imageBase64) {
        const image = saved.imageBase64;
        getSession().then((session) => {
          if (session) runExtraction(image);
        });
      } else if (saved.categories?.length) {
        setStep('preview');
      } else {
        setError('Your photo could not be kept through sign-in — please select it again.');
      }
    } else if (saved.step === 'preview' && saved.categories?.length) {
      setStep('preview');
    } else if (saved.step === 'details' && saved.categories?.length) {
      setStep('details');
    }
  }, [runExtraction]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setImageBase64(base64);
  }, []);

  const handleExtract = async () => {
    if (!imageBase64) return;
    const session = await getSession();
    if (!session) {
      saveFunnelState({ step: 'extract', imageBase64 });
      await signIn(undefined, { callbackUrl: '/d' });
      return;
    }
    runExtraction(imageBase64);
  };

  const updateDish = (catIdx: number, dishIdx: number, field: 'name' | 'price', value: string) => {
    setCategories((prev) => {
      if (!prev) return prev;
      return prev.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : {
              ...cat,
              dishes: cat.dishes.map((dish, di) =>
                di !== dishIdx ? dish : { ...dish, [field]: value }
              ),
            }
      );
    });
  };

  const goToDetails = () => {
    if (!categories) return;
    saveFunnelState({ step: 'details', imageBase64: imageBase64 ?? undefined, categories, restaurant });
    setError(null);
    setStep('details');
  };

  const handlePublish = async () => {
    if (!categories) return;
    if (!restaurant.name.trim()) {
      setError('Give your restaurant a name first.');
      return;
    }
    setStep('publishing');
    setError(null);
    const sanitized = categories.map((cat) => ({
      name: cat.name,
      dishes: cat.dishes.map((d) => ({
        name: d.name,
        description: d.description || '',
        price: typeof d.price === 'string' ? parseFloat(d.price) || 0 : d.price,
        tags: d.tags || [],
      })),
    }));
    try {
      const res = await publishCatalog({
        restaurant: {
          name: restaurant.name.trim(),
          address: restaurant.address.trim(),
          phone: restaurant.phone.trim(),
        },
        categories: sanitized,
      });
      if (res.requiresAuth) {
        saveFunnelState({ step: 'details', imageBase64: imageBase64 ?? undefined, categories, restaurant });
        await signIn(undefined, { callbackUrl: '/d' });
        return;
      }
      if (res.data) {
        clearFunnelState();
        setResult(res.data);
        setStep('success');
      } else {
        setError(res.message ?? 'Publish failed. Please try again.');
        setStep('details');
      }
    } catch {
      setError('Publish failed. Please try again.');
      setStep('details');
    }
  };

  const handleCopyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy — long-press the link instead.');
    }
  };

  const totalDishes = categories?.reduce((sum, cat) => sum + cat.dishes.length, 0) ?? 0;
  const activeIdx = stepIndex(step);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* step rail */}
      <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        {STEP_LABELS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center border-2 border-ink font-display text-xs font-extrabold ${
                i <= activeIdx ? 'bg-tomato text-paper' : 'bg-paper text-ink/50'
              }`}
            >
              {i + 1}
            </span>
            <span className={i <= activeIdx ? 'text-ink' : 'text-ink/40'}>{s.label}</span>
            {i < STEP_LABELS.length - 1 && <span className="text-ink/30">—</span>}
          </li>
        ))}
      </ol>

      <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[0.95] tracking-tight">
        {step === 'success' ? (
          <>
            Your menu is <span className="bg-lime px-2">live</span>.
          </>
        ) : (
          <>
            Snap it. <span className="bg-tomato px-2 text-paper">Share it.</span>
          </>
        )}
      </h1>

      {error && (
        <p className="mt-5 border-3 border-ink bg-tomato p-3 font-mono text-xs font-bold uppercase tracking-widest text-paper">
          ⚠ {error}
        </p>
      )}

      {/* STEP: photo / extracting */}
      {(step === 'photo' || step === 'extracting') && (
        <div className="mt-6">
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            className={`flex flex-col items-center justify-center gap-3 border-3 border-dashed p-8 text-center transition-all ${
              dragActive ? 'border-tomato bg-tomato/5' : 'border-ink/40 bg-bone hover:border-ink'
            }`}
          >
            {step === 'extracting' ? (
              <>
                <div className="flex gap-1">
                  <span className="h-3 w-3 animate-pulse bg-tomato" />
                  <span className="h-3 w-3 animate-pulse bg-mustard" style={{ animationDelay: '0.15s' }} />
                  <span className="h-3 w-3 animate-pulse bg-lime" style={{ animationDelay: '0.3s' }} />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest">Reading your menu…</p>
              </>
            ) : imageBase64 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageBase64}
                  alt="Your menu photo"
                  className="max-h-72 border-3 border-ink shadow-brut"
                />
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={handleExtract} className="btn-brut-primary text-sm">
                    Extract menu →
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-brut text-sm"
                  >
                    Pick another photo
                  </button>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  Free account needed for extraction — we&apos;ll bring you right back
                </p>
              </>
            ) : (
              <>
                <div className="grid h-14 w-14 place-items-center border-3 border-ink bg-paper shadow-brut-sm font-display text-2xl">
                  ◧
                </div>
                <p className="font-display text-lg font-extrabold tracking-tight">
                  Drop your menu photo here
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-ink/60">or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-brut-primary text-xs"
                >
                  Choose file
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>
      )}

      {/* STEP: preview */}
      {step === 'preview' && categories && (
        <div className="mt-6 card-brut p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-3 border-ink pb-3">
            <p className="font-display text-base font-extrabold">
              Found {totalDishes} dish{totalDishes !== 1 ? 'es' : ''}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              Edit before publishing
            </p>
          </div>

          <div className="mt-4 max-h-96 space-y-5 overflow-y-auto pr-1">
            {categories.map((cat, catIdx) => (
              <div key={catIdx}>
                <h4 className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
                  <span>cat / {String(catIdx + 1).padStart(2, '0')}</span>
                  <span className="text-ink">{cat.name}</span>
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {cat.dishes.map((dish, dishIdx) => (
                    <li key={dishIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={dish.name}
                        onChange={(e) => updateDish(catIdx, dishIdx, 'name', e.target.value)}
                        className="flex-1 border-2 border-ink bg-paper px-2 py-1.5 font-mono text-sm focus:outline-hidden focus:bg-lime"
                      />
                      <div className="flex items-stretch border-2 border-ink">
                        <span className="grid place-items-center bg-ink px-2 font-display text-xs font-extrabold text-paper">
                          $
                        </span>
                        <input
                          type="number"
                          value={dish.price}
                          min={0}
                          step={0.01}
                          onChange={(e) => updateDish(catIdx, dishIdx, 'price', e.target.value)}
                          className="w-20 bg-paper px-2 py-1.5 text-right font-mono text-sm focus:bg-lime focus:outline-hidden"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={goToDetails} className="btn-brut-primary text-xs">
              Looks right →
            </button>
            <button
              type="button"
              onClick={() => {
                setCategories(null);
                setError(null);
                setStep('photo');
              }}
              className="btn-brut text-xs"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* STEP: details / publishing */}
      {(step === 'details' || step === 'publishing') && (
        <div className="mt-6 card-brut p-5 sm:p-6">
          <p className="font-display text-base font-extrabold">Name your place</p>
          <p className="mt-1 font-mono text-xs text-ink/60">
            Only the name is required — you can fill in the rest later in your panel.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest">Restaurant name *</span>
              <input
                type="text"
                value={restaurant.name}
                onChange={(e) => setRestaurant((r) => ({ ...r, name: e.target.value }))}
                placeholder="Casa Lupita"
                className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm focus:bg-lime focus:outline-hidden"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest">Address (optional)</span>
              <input
                type="text"
                value={restaurant.address}
                onChange={(e) => setRestaurant((r) => ({ ...r, address: e.target.value }))}
                className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm focus:bg-lime focus:outline-hidden"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest">Phone (optional)</span>
              <input
                type="tel"
                value={restaurant.phone}
                onChange={(e) => setRestaurant((r) => ({ ...r, phone: e.target.value }))}
                className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm focus:bg-lime focus:outline-hidden"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePublish}
              disabled={step === 'publishing'}
              className="btn-brut-primary text-xs disabled:opacity-60"
            >
              {step === 'publishing' ? 'Publishing…' : `Publish ${totalDishes} dishes + get QR →`}
            </button>
            <button
              type="button"
              onClick={() => setStep('preview')}
              disabled={step === 'publishing'}
              className="btn-brut text-xs disabled:opacity-60"
            >
              ← Back to dishes
            </button>
          </div>
        </div>
      )}

      {/* STEP: success */}
      {step === 'success' && result && (
        <div className="mt-6 card-brut p-5 sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0 border-3 border-ink bg-paper p-2 shadow-brut">
              {result.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.qrCode} alt="QR code for your menu" className="h-44 w-44" />
              ) : (
                <div className="grid h-44 w-44 place-items-center font-mono text-xs text-ink/50">
                  QR unavailable
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-extrabold">One QR. Every table.</p>
              <a
                href={result.menuUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate border-2 border-ink bg-bone px-3 py-2 font-mono text-xs hover:bg-lime"
              >
                {result.menuUrl}
              </a>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleCopyLink} className="btn-brut-primary text-xs">
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
                {result.qrCode && (
                  <a href={result.qrCode} download="dineqrs-qr.png" className="btn-brut text-xs">
                    Download QR
                  </a>
                )}
                <a
                  href={result.menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-brut text-xs"
                >
                  View menu
                </a>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                Print the QR, stick it on tables — edit dishes anytime from your panel.
              </p>
              <Link href="/panel" className="mt-2 inline-block font-mono text-xs underline">
                Go to panel →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
