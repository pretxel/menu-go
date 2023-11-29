'use client';
import { useRouter } from 'next/navigation';

const products = [
  {
    id: 1,
    name: 'Entrantes',
    href: '/panel/dishes/1',
    imageSrc:
      'https://cdn.recetasderechupete.com/wp-content/uploads/2020/11/Aperitivos-navidenos-faciles.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 2,
    name: 'Plato principal',
    href: '/panel/dishes/2',
    imageSrc:
      'https://content.skyscnr.com/m/2dcd7d0e6f086057/original/GettyImages-186142785.jpg?crop=1224px:647px&quality=100&position=attention',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 3,
    name: 'Postres',
    href: '/panel/dishes/3',
    imageSrc:
      'https://www.clara.es/medio/2021/11/28/postres-navidenos_3f462fd7_1280x1115.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 4,
    name: 'Bebidas ',
    href: '/panel/dishes/4',
    imageSrc:
      'https://www.supercash.es/wp-content/uploads/2022/02/bebidas-refrescantes.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
];

export default function Dishes() {
  const router = useRouter();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-h-3 aspect-w-4 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  className="object-cover object-center"
                />
                <div
                  className="flex items-end p-4 opacity-100"
                  aria-hidden="true"
                >
                  <button
                    type="submit"
                    onClick={() => router.push(product.href)}
                    className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                  >
                    {product.name}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
