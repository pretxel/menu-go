/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import 'react-toastify/dist/ReactToastify.css';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, useActionState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { addCategory } from '../../app/actions';

type IDialogCategory = {
  open: boolean;
  setOpen: (open: boolean) => void;
  category: any;
};

const initialState = { message: null };

export default function DialogCategory({ open, setOpen, category }: IDialogCategory) {
  const [state, formAction] = useActionState(addCategory, initialState);

  useEffect(() => {
    if (state?.message) toast.success(state?.message);
  }, [state]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md border-l-3 border-ink">
                <form
                  className="flex h-full flex-col bg-paper"
                  action={formAction}
                >
                  <div className="border-b-3 border-ink bg-tomato px-6 py-5 text-paper">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="font-display text-2xl font-extrabold tracking-tight">
                        {category ? 'Edit category' : 'New category'}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="border-2 border-paper bg-tomato p-1 hover:bg-paper hover:text-ink"
                        onClick={() => setOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-1 font-mono text-xs uppercase tracking-widest text-paper/80">
                      Group your dishes — Mains, Drinks, Sides
                    </p>
                  </div>

                  <div className="flex-1 space-y-6 px-6 py-6">
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                        Category name <span className="text-tomato">*</span>
                      </span>
                      <input
                        type="text"
                        name="name"
                        defaultValue={category?.name || ''}
                        className="input-brut mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                        Description
                      </span>
                      <textarea
                        name="description"
                        rows={4}
                        defaultValue={category?.description || ''}
                        className="input-brut mt-2 resize-y"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t-3 border-ink bg-bone px-6 py-4">
                    <button
                      type="button"
                      className="btn-brut text-xs"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-brut-primary text-xs">
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
