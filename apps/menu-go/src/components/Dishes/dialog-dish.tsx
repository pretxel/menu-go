/* eslint-disable @next/next/no-img-element */
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

export default function DialogDish({ open, setOpen, restaurant }) {
  const downloadImage = (e) => {
    e.preventDefault();
    fetch(restaurant.qrCode, { method: 'GET', headers: {} })
      .then((response) => {
        response.arrayBuffer().then(function (buffer) {
          const url = window.URL.createObjectURL(new Blob([buffer]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'qr-code.png');
          document.body.appendChild(link);
          link.click();
        });
      })
      .catch((err) => console.log(err));
  };

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
          <div className="fixed inset-0 bg-ink/70" />
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
              <Dialog.Panel className="pointer-events-auto w-screen max-w-sm border-l-3 border-ink">
                <div className="flex h-full flex-col bg-paper">
                  <div className="flex items-center justify-between border-b-3 border-ink bg-lime px-6 py-5">
                    <Dialog.Title className="font-display text-xl font-extrabold tracking-tight">
                      Your QR Code
                    </Dialog.Title>
                    <button
                      type="button"
                      className="border-2 border-ink bg-paper p-1 hover:bg-ink hover:text-paper"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-5 px-6 py-6">
                    <div className="border-3 border-ink bg-paper p-3 shadow-brut">
                      {restaurant?.qrCode ? (
                        <img
                          src={restaurant.qrCode}
                          alt="qr"
                          className="aspect-square w-full object-contain"
                        />
                      ) : (
                        <div className="grid aspect-square w-full place-items-center font-mono text-xs uppercase tracking-widest text-ink/40">
                          No QR yet
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">
                        Public URL
                      </p>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurant?.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all border-3 border-ink bg-bone p-3 font-mono text-xs hover:bg-lime"
                      >
                        {process.env.NEXT_PUBLIC_SITE_URL}/menu/{restaurant?.id}
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={downloadImage}
                      className="btn-brut-primary w-full text-sm"
                    >
                      Download QR ↓
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
