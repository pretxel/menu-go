'use client';

import { useEffect, useState } from 'react';

import { IDish } from '../../types/dish';
import EmptyList from './empty-list';
import RemoveButton from './remove-button';

type Props = { dishes: IDish[] | null };

export default function ListDishes({ dishes }: Props) {
  const [dishesD, setDishes] = useState<IDish[] | null>(dishes);

  useEffect(() => {
    setDishes(dishes);
  }, [dishes]);

  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
            Inventory
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
            Dishes
          </h2>
        </div>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/50 sm:inline">
          {dishesD?.length ?? 0} items
        </span>
      </div>

      {dishesD?.length === 0 ? (
        <EmptyList />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-3 border-ink">
            <thead className="bg-ink text-paper">
              <tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th align="right">Price</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {dishesD &&
                dishesD.map((dish, i) => (
                  <tr
                    key={dish.id}
                    className={i % 2 ? 'bg-bone' : 'bg-paper'}
                  >
                    <Td>
                      <span className="font-display font-extrabold">
                        {dish.name}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs uppercase tracking-widest text-ink/70">
                        {dish?.category?.name}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-display font-extrabold text-tomato">
                        ${dish.price}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`dishes/${dish.categoryId}/edit/${dish.id}`}
                          className="font-mono text-xs font-bold uppercase tracking-widest underline-offset-4 hover:underline"
                        >
                          Edit
                        </a>
                        <RemoveButton idType={dish.id} type="dish" />
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.3em] ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td
      className={`border-t-2 border-ink px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </td>
  );
}
