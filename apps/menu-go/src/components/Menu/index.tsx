import Category from './category';
import Banner from './restaurant-banner';
import UserNoAuth from './user-no-auth';

export default function Menu({ dishes, restaurant }) {
  const groupByCategory = dishes.reduce((acumulador, elemento) => {
    if (acumulador[elemento.category.name]) {
      acumulador[elemento.category.name].push(elemento);
    } else {
      acumulador[elemento.category.name] = [elemento];
    }
    return acumulador;
  }, {});

  const primary = restaurant.primaryColor ?? '#FF3B2E';
  const bg = restaurant.backgroundColor ?? '#FAFAF5';

  return (
    <div
      style={
        {
          '--color-primary': primary,
          '--color-bg': bg,
          backgroundColor: bg,
        } as import('react').CSSProperties
      }
      className="min-h-screen text-ink"
    >
      <UserNoAuth />
      <Banner restaurant={restaurant} />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {Object.entries(groupByCategory).map(([key, value], idx) => (
          <Category key={key} category={value} name={key} index={idx} />
        ))}

        <div className="mt-20 flex flex-col items-center gap-3">
          <div className="h-1 w-24 bg-ink" />
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
            End of menu · {restaurant.name}
          </p>
        </div>
      </div>
    </div>
  );
}
