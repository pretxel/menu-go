'use client';
import 'react-toastify/dist/ReactToastify.css';

import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'react-toastify';

export default function RemoveModal({ open, setOpen, idType, type }) {
  const cancelButtonRef = useRef(null);
  const router = useRouter();

  const removeDish = async (id) => {
    const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.status === 200 && data.id === id) toast.success('Dish removed');
    else toast.error('Error removing dish');
    router.refresh();
  };

  const removeCategory = async (id) => {
    try {
      const res = await fetch(`/api/category/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.status === 200 && data.id === id) toast.success('Category removed');
      else toast.error('Error removing category');
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error('Error removing category');
    }
  };

  return (
    <Transition.Root show={open}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/70" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="card-brut relative w-full max-w-md text-left transition-all sm:my-8">
                <div className="border-b-3 border-ink bg-tomato p-6 text-paper">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center border-3 border-paper bg-paper text-tomato">
                      <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Dialog.Title
                      as="h3"
                      className="font-display text-2xl font-extrabold tracking-tight"
                    >
                      Remove {type}?
                    </Dialog.Title>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <p className="font-mono text-sm text-ink/80">
                    This is permanent. The {type} will be deleted from your menu.
                  </p>
                </div>
                <div className="flex justify-end gap-3 border-t-3 border-ink bg-bone px-6 py-4">
                  <button
                    type="button"
                    className="btn-brut text-xs"
                    onClick={() => setOpen(false)}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-brut-primary text-xs"
                    onClick={() => {
                      setOpen(false);
                      if (type === 'category') removeCategory(idType);
                      else removeDish(idType);
                    }}
                  >
                    Remove →
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
