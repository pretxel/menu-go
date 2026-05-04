import Image from 'next/image';

const TAG_LABELS: Record<string, { label: string; bg: string }> = {
  vegan: { label: 'Vegan', bg: 'bg-lime' },
  vegetarian: { label: 'Vegetarian', bg: 'bg-lime' },
  spicy: { label: 'Spicy', bg: 'bg-tomato text-paper' },
  'gluten-free': { label: 'Gluten-Free', bg: 'bg-mustard' },
  'dairy-free': { label: 'Dairy-Free', bg: 'bg-sky' },
};

export default function Dish({ dish }) {
  const tags: string[] = dish.tags || [];

  return (
    <article className="group relative">
      <div className="card-brut flex h-full flex-col overflow-hidden transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-brut-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b-3 border-ink bg-bone">
          {dish.image ? (
            <Image
              src={dish.image}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={dish.name}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bone">
              <span className="font-display text-5xl">🍽️</span>
            </div>
          )}
          <span
            className="absolute right-3 top-3 inline-flex items-center border-3 border-ink bg-paper px-2.5 py-1 font-display text-base font-extrabold shadow-brut-sm"
            style={{ color: 'var(--color-primary, #FF3B2E)' }}
          >
            ${dish.price?.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight">
            {dish.name}
          </h3>
          {dish.description && (
            <p className="mt-2 line-clamp-3 font-mono text-sm leading-relaxed text-ink/70">
              {dish.description}
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {tags.map((tag) => {
                const info = TAG_LABELS[tag] || { label: tag, bg: 'bg-paper' };
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center border-2 border-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${info.bg}`}
                  >
                    {info.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
