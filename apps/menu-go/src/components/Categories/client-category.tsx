'use client';
import { useState } from 'react';

import DialogCategory from './dialog-category';
import EmptyCategory from './empty-category';

export default function ClientCategory() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EmptyCategory setOpen={setOpen} />
      <DialogCategory open={open} setOpen={setOpen} />
    </>
  );
}
