'use client';

import { useEffect, useState } from 'react';

import { getRestaurant, Restaurant } from '../../app/actions';
import DialogDish from './dialog-dish';

export default function DishHeader({ restaurant }) {
  const [open, setOpen] = useState(false);
  const [restaurantD, setRestaurantD] = useState<Restaurant | null>();

  useEffect(() => {
    if (!restaurant) {
      const userId = localStorage.getItem('usedIdTemp') ?? '';
      getRestaurant(userId).then((res) => setRestaurantD(res));
    } else {
      setRestaurantD(restaurant);
    }
  }, [restaurant]);

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
      <DialogDish open={open} setOpen={setOpen} restaurant={restaurantD} />
    </>
  );
}
