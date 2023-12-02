import Dish from './dish';

export default function Category({ category, name }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-1 lg:max-w-7xl lg:px-4">
      <h2 className="sr-only">{name}</h2>

      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {name}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 py-5 ">
        {category.map((dish) => (
          <Dish key={dish.id} dish={dish} />
        ))}
      </div>
    </div>
  );
}
