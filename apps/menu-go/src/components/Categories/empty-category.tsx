import { PlusIcon } from '@heroicons/react/20/solid';

export default function EmptyCategory({ setOpen }) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        className="btn-brut-lime text-sm"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
        New category
      </button>
    </div>
  );
}
