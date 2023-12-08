/* eslint-disable @next/next/no-img-element */
'use client';

import 'react-toastify/dist/ReactToastify.css';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import {
  FacebookIcon,
  FacebookShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from 'react-share';
import { toast } from 'react-toastify';

import { postRestaurant } from '../../app/actions';
import SuccessMessage from '../Alerts';
import InfoAlert from './info-alert';

const initialState = {
  message: null,
};

export default function Form({ user, restaurant }) {
  const [state, formAction] = useFormState(postRestaurant, initialState);

  useEffect(() => {
    if (state?.message) {
      toast.success(state?.message);
    }
  }, [state]);

  return (
    // eslint-disable-next-line react/jsx-no-bind
    <form action={formAction}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          {restaurant && <InfoAlert />}
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Business name
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Business name information and settings.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  defaultValue={restaurant?.name || ''}
                  autoComplete="given-name"
                  className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="mt-2">
                <input
                  type="hidden"
                  name="userId"
                  id="userId"
                  value={user.id}
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className="sm:col-span-3 sm:col-start-1">
              <label
                htmlFor="address"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  defaultValue={restaurant?.address || ''}
                  autoComplete="given-address"
                  className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Phone
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  required
                  defaultValue={restaurant?.phone || ''}
                  autoComplete="given-phone"
                  className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            {restaurant && (
              <>
                <div className="sm:col-span-3">
                  <label
                    htmlFor="menu"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    URL
                  </label>
                  <div className="mt-2">
                    <a
                      href={
                        `${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant?.id}` ||
                        ''
                      }
                    >
                      {`${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant?.id}`}
                    </a>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label
                    htmlFor="menu"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    QR
                  </label>
                  <div className="mt-2">
                    <img src={restaurant?.qrCode || ''} alt="" />
                  </div>

                  <div className="flex sm:col-span-2 gap-2">
                    <FacebookShareButton
                      url={`${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant?.id}`}
                    >
                      <FacebookIcon size={32} round />
                    </FacebookShareButton>

                    <WhatsappShareButton
                      url={`${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant?.id}`}
                      title={`Menu ${restaurant?.name}`}
                      separator=":: "
                    >
                      <WhatsappIcon size={32} round />
                    </WhatsappShareButton>
                    <TwitterShareButton
                      url={`${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant?.id}`}
                      title={`Menu ${restaurant?.name}`}
                    >
                      <XIcon size={32} round />
                    </TwitterShareButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only" role="status">
        {state?.message && <SuccessMessage message={state?.message} />}
      </p>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>
      </div>
    </form>
  );
}
