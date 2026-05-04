import Dish from './dish';

export default function Category({ category, name, index = 0 }) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <section className="mt-14 first:mt-10">
      <div className="flex items-end justify-between gap-4 border-b-3 border-ink pb-4">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-sm font-bold text-ink/40">
            {num}
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {name}
          </h2>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
          {category.length} {category.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
        {category.map((dish) => (
          <Dish key={dish.id} dish={dish} />
        ))}
      </div>
    </section>
  );
}
