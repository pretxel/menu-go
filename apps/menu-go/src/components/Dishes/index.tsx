/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';

export default function Dishes({ categories }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="sm:flex-auto">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          Categories
        </h1>
        <p className="mt-2 text-sm text-gray-700">Add categories.</p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
        {categories.map((product) => (
          <div
            key={product.id}
            className="group relative cursor-pointer"
            onClick={() => router.push(`/panel/dishes/${product.id}`)}
          >
            <div
              className="aspect-h-3 aspect-w-4 overflow-hidden rounded-lg bg-gray-100"
              style={{ height: '200px' }}
            >
              <img
                src={product.image}
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
