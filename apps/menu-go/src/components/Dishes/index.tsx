'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const products = [
  {
    id: 1,
    name: 'Appetizers',
    href: '/panel/dishes/1',
    imageSrc: '/images/categories/appetizers.png',
    imageAlt: 'Appetizers',
  },
  {
    id: 2,
    name: 'Main Course',
    href: '/panel/dishes/2',
    imageSrc: '/images/categories/main.png',
    imageAlt: 'Main Course',
  },
  {
    id: 3,
    name: 'Dessert',
    href: '/panel/dishes/3',
    imageSrc: '/images/categories/dessert.png',
    imageAlt: 'Dessert',
  },
  {
    id: 4,
    name: 'Beverages',
    href: '/panel/dishes/4',
    imageSrc: '/images/categories/drinks.png',
    imageAlt: 'Beverages',
  },
];

export default function Dishes() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative cursor-pointer"
            onClick={() => router.push(product.href)}
          >
            <div
              className="aspect-h-3 aspect-w-4 overflow-hidden rounded-lg bg-gray-100"
              style={{ height: '200px' }}
            >
              <Image
                src={product.imageSrc}
                alt={product.imageAlt}
                className="object-cover object-center"
                width={400}
                height={200}
                style={{ objectFit: 'fill' }}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
            >
              {product.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
