'use client';

import { useState } from 'react';

import RemoveModal from './remove-modal';

export default function RemoveButton({ idType, type }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-xs font-bold uppercase tracking-widest text-tomato underline-offset-4 hover:underline"
      >
        Remove
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
