'use client';

import { useState } from 'react';

import type { Restaurant } from '../../app/actions';
import DialogDish from './dialog-dish';

type Props = { restaurant: Restaurant | null };

export default function DishHeader({ restaurant }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-brut-lime text-xs"
        >
          ◧ QR Code
        </button>
      </div>
      <DialogDish open={open} setOpen={setOpen} restaurant={restaurant} />
    </>
  );
}
