/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';

export default function Dishes({ categories }) {
  const router = useRouter();

  return (
    <div className="py-6">
      <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
            Catalog
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Categories
          </h1>
          <p className="mt-2 font-mono text-sm text-ink/70">
            Pick a category to add or edit dishes.
          </p>
        </div>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/50 sm:inline">
          {categories?.length ?? 0} total
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((product, idx) => (
          <button
            key={product.id}
            type="button"
            onClick={() => router.push(`dishes/${product.id}`)}
            className="group relative block text-left"
          >
            <div className="card-brut overflow-hidden transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-brut-lg">
              <div className="relative aspect-4/3 w-full overflow-hidden border-b-3 border-ink bg-bone">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-5xl">
                    🍽
                  </div>
                )}
                <span className="absolute left-3 top-3 border-3 border-ink bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest shadow-brut-sm">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-display text-lg font-extrabold tracking-tight">
                  {product.name}
                </span>
                <span className="grid h-8 w-8 place-items-center border-2 border-ink bg-tomato text-paper font-display font-extrabold">
                  →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
