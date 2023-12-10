'use client';
import { useEffect, useState } from 'react';

import DialogCategory from './dialog-category';
import EmptyCategory from './empty-category';

export default function ClientCategory({ categoryId, category }) {
  const [open, setOpen] = useState(!!categoryId);

  useEffect(() => {
    setOpen(!!categoryId);
  }, [categoryId]);

  return (
    <>
      <EmptyCategory setOpen={setOpen} />
      <DialogCategory open={open} setOpen={setOpen} category={category} />
    </>
  );
}
