'use client';

import { useState } from 'react';

import RemoveModal from './remove-modal';

export default function RemoveButton({ idType, type }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-900"
      >
        Remove<span className="sr-only">Remove</span>
      </button>
      {open && (
        <RemoveModal
          open={open}
          setOpen={setOpen}
          idType={idType}
          type={type}
        />
      )}
    </>
  );
}
