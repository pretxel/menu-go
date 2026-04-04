'use client';

import { useCallback, useRef, useState } from 'react';

import { parseMenuFromPhoto, postBulkDishes } from '../../app/actions';

type ParsedDish = { name: string; description: string; price: number | string; tags: string[] };
type ParsedCategory = { name: string; dishes: ParsedDish[] };

type PhotoMenuImporterProps = {
  userId: string;
  initialCategories?: ParsedCategory[];
};

export default function PhotoMenuImporter({ userId, initialCategories }: PhotoMenuImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  // initialCategories seeds state for testing; post-mount updates to this prop are ignored.
  const [categories, setCategories] = useState<ParsedCategory[] | null>(initialCategories ?? null);
  const [error, setError] = useState<string | null>(null);
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
        setError('Could not extract menu items from this image. Try a clearer photo.');
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
      setIsOpen(false);
    } catch {
      setError('Failed to import dishes. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const totalDishes = categories?.reduce((sum, cat) => sum + cat.dishes.length, 0) ?? 0;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Import from photo
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Import Menu from Photo</h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setCategories(null);
            setError(null);
          }}
          className="text-gray-400 hover:text-gray-500 text-sm"
        >
          Close
        </button>
      </div>

      {!categories && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 transition-colors"
        >
          {isParsing ? (
            <p className="text-sm text-gray-500">Analyzing menu photo...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop a menu photo here, or
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Select file
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

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {categories && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Found {totalDishes} dish{totalDishes !== 1 ? 'es' : ''} in {categories.length}{' '}
            categor{categories.length !== 1 ? 'ies' : 'y'} — edit before importing
          </p>
          <div className="max-h-80 overflow-y-auto space-y-4">
            {categories.map((cat, catIdx) => (
              <div key={catIdx}>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{cat.name}</h4>
                <ul className="space-y-2">
                  {cat.dishes.map((dish, dishIdx) => (
                    <li key={dishIdx} className="flex items-center gap-2 pl-3">
                      <input
                        type="text"
                        data-field="name"
                        value={dish.name}
                        onChange={(e) => updateDish(catIdx, dishIdx, 'name', e.target.value)}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="number"
                        data-field="price"
                        value={dish.price}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateDish(catIdx, dishIdx, 'price', e.target.value)}
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleImportAll}
              disabled={isImporting}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import all'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCategories(null);
                setError(null);
              }}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
