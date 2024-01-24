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

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        <Banner restaurant={restaurant} />
        <UserNoAuth />

        {Object.entries(groupByCategory).map(([key, value]) => (
          <Category key={key} category={value} name={key} />
        ))}
      </div>
    </div>
  );
}
