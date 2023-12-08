import Image from 'next/image';

export default function Dish({ dish }) {
  return (
    <a key={dish.id} href={'#'} className="group">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
        {dish.image && (
          <Image
            src={dish.image || '/images/dish.png'}
            alt={dish.name}
            width={600}
            height={400}
            className="h-full w-full object-cover object-center group-hover:opacity-75"
          />
        )}
      </div>
      <h3 className="mt-4 text-lg text-gray-700 font-bold">{dish.name}</h3>
      <p className="mt-1 text-sm text-gray-900">Description</p>
      <span className="mt-1 text-lg font-medium text-gray-900">
        ${dish?.price}
      </span>
    </a>
  );
}
