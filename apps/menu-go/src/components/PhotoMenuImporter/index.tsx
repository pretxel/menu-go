'use client';

import { useCallback, useRef, useState } from 'react';

import { parseMenuFromPhoto, postBulkDishes } from '../../app/actions';

type ParsedDish = { name: string; description: string; price: number | string; tags: string[] };
type ParsedCategory = { name: string; dishes: ParsedDish[] };

type PhotoMenuImporterProps = {
  userId: string;
  initialCategories?: ParsedCategory[];
  alwaysOpen?: boolean;
  onImportSuccess?: () => void;
};

export default function PhotoMenuImporter({
  userId,
  initialCategories,
  alwaysOpen,
  onImportSuccess,
}: PhotoMenuImporterProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen ?? false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [categories, setCategories] = useState<ParsedCategory[] | null>(initialCategories ?? null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    setIsParsing(true);
    setCategories(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await parseMenuFromPhoto(base64);
      if (result?.categories?.length) {
        setCategories(result.categories);
      } else {
        setError('Could not extract menu items. Try a clearer photo.');
      }
    } catch {
      setError('Failed to parse menu photo. Please try again.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImportAll = async () => {
    if (!categories) return;
    setIsImporting(true);
    setError(null);
    try {
      const sanitized = categories.map((cat) => ({
        ...cat,
        dishes: cat.dishes.map((d) => ({
          ...d,
          price: typeof d.price === 'string' ? parseFloat(d.price) || 0 : d.price,
        })),
      }));
      await postBulkDishes(userId, sanitized);
      setCategories(null);
      if (onImportSuccess) onImportSuccess();
      else setIsOpen(false);
    } catch {
      setError('Failed to import dishes. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const totalDishes = categories?.reduce((sum, cat) => sum + cat.dishes.length, 0) ?? 0;

  if (!isOpen && !alwaysOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-brut-lime text-xs"
      >
        ◧ Import from photo
      </button>
    );
  }

  return (
    <div className="card-brut overflow-hidden">
      <div className="flex items-center justify-between border-b-3 border-ink bg-tomato px-5 py-3 text-paper">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center border-2 border-paper bg-paper text-tomato font-display text-sm font-extrabold">
            ◧
          </span>
          <h3 className="font-display text-base font-extrabold uppercase tracking-tight">
            Photo importer
          </h3>
        </div>
        {!alwaysOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setCategories(null);
              setError(null);
            }}
            className="border-2 border-paper bg-tomato px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-paper hover:text-tomato"
          >
            Close ×
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {!categories && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            className={`flex flex-col items-center justify-center gap-3 border-3 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-tomato bg-tomato/5'
                : 'border-ink/40 bg-bone hover:border-ink'
            }`}
          >
            {isParsing ? (
              <>
                <div className="flex gap-1">
                  <span className="h-3 w-3 animate-pulse bg-tomato" />
                  <span className="h-3 w-3 animate-pulse bg-mustard" style={{ animationDelay: '0.15s' }} />
                  <span className="h-3 w-3 animate-pulse bg-lime" style={{ animationDelay: '0.3s' }} />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest">
                  Reading your menu…
                </p>
              </>
            ) : (
              <>
                <div className="grid h-14 w-14 place-items-center border-3 border-ink bg-paper shadow-brut-sm font-display text-2xl">
                  ◧
                </div>
                <p className="font-display text-lg font-extrabold tracking-tight">
                  Drop menu photo here
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-brut-primary text-xs"
                >
                  Choose file
                </button>
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
              </>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 border-3 border-ink bg-tomato p-3 font-mono text-xs font-bold uppercase tracking-widest text-paper">
            ⚠ {error}
          </p>
        )}

        {categories && (
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-3 border-ink pb-3">
              <p className="font-display text-base font-extrabold">
                Found {totalDishes} dish{totalDishes !== 1 ? 'es' : ''}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                Edit before importing
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
                          data-field="name"
                          value={dish.name}
                          onChange={(e) => updateDish(catIdx, dishIdx, 'name', e.target.value)}
                          className="flex-1 border-2 border-ink bg-paper px-2 py-1.5 font-mono text-sm focus:outline-none focus:bg-lime"
                        />
                        <div className="flex items-stretch border-2 border-ink">
                          <span className="grid place-items-center bg-ink px-2 font-display text-xs font-extrabold text-paper">
                            $
                          </span>
                          <input
                            type="number"
                            data-field="price"
                            value={dish.price}
                            min={0}
                            step={0.01}
                            onChange={(e) => updateDish(catIdx, dishIdx, 'price', e.target.value)}
                            className="w-20 bg-paper px-2 py-1.5 text-right font-mono text-sm focus:bg-lime focus:outline-none"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleImportAll}
                disabled={isImporting}
                className="btn-brut-primary text-xs disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : `Import all ${totalDishes} →`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategories(null);
                  setError(null);
                }}
                className="btn-brut text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
