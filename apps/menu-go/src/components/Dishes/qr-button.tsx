'use client';

import { useState } from 'react';

import DialogDish from './dialog-dish';

export default function DishHeader({ restaurant }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-1 sm:px-6 sm:py-1 lg:max-w-7xl lg:px-8">
      <div className="lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:space-x-4">
        <a
          href="#"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span>QR Code</span>
        </a>
      </div>

      <DialogDish open={open} setOpen={setOpen} restaurant={restaurant} />
    </div>
  );
}
