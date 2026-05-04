import ItemCategory from './item-category';

export default function ListCategories({ categories }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
            Catalog
          </span>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Categories
          </h2>
        </div>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/50 sm:inline">
          {categories.length} total
        </span>
      </div>

      {categories.length === 0 && (
        <div className="mt-10 grid place-items-center border-3 border-dashed border-ink/40 bg-bone p-12 text-center">
          <span className="font-display text-4xl">∅</span>
          <h3 className="mt-3 font-display text-xl font-extrabold">
            No categories yet
          </h3>
          <p className="mt-1 font-mono text-sm text-ink/60">
            Add your first category to start building the menu.
          </p>
        </div>
      )}

      <ul
        role="list"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {categories.map((category) => (
          <ItemCategory key={category.id} category={category} />
        ))}
      </ul>
    </div>
  );
}
