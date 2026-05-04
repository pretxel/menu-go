'use client';
import { useRouter } from 'next/navigation';

import RemoveButton from '../List/remove-button';

const PALETTE = ['bg-tomato text-paper', 'bg-lime text-ink', 'bg-mustard text-ink', 'bg-sky text-ink'];

function generateInitials(name: string) {
  const [first, second] = name.split(' ');
  if (!second) return first.charAt(0).toUpperCase();
  return `${first.charAt(0)}${second?.charAt(0)}`.toUpperCase();
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function ItemCategory({ category }) {
  const router = useRouter();
  const swatch = colorFor(category.name);

  return (
    <li className="card-brut group flex transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg">
      <button
        type="button"
        onClick={() => router.push(`?category=${category.id}`)}
        className="flex flex-1 items-stretch text-left"
      >
        <div
          className={`grid w-20 flex-shrink-0 place-items-center border-r-3 border-ink font-display text-2xl font-extrabold ${swatch}`}
        >
          {generateInitials(category.name)}
        </div>
        <div className="flex-1 px-4 py-3">
          <p className="font-display text-lg font-extrabold tracking-tight">
            {category.name}
          </p>
          {category.description && (
            <p className="mt-0.5 line-clamp-2 font-mono text-xs text-ink/70">
              {category.description}
            </p>
          )}
        </div>
      </button>
      <div className="grid place-items-center border-l-3 border-ink bg-paper px-3">
        <RemoveButton idType={category.id} type="category" />
      </div>
    </li>
  );
}
