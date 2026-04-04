/* eslint-disable @next/next/no-img-element */
'use client';

import 'react-toastify/dist/ReactToastify.css';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

import { getRestaurant, postRestaurant, Restaurant } from '../../app/actions';
import SuccessMessage from '../Alerts';
import UserNoAuth from '../Menu/user-no-auth';
import InfoAlert from './info-alert';

const initialState = {
  message: null,
};

export default function Form({ userId }) {
  const [userIdD, setUserDId] = useState<string>('');
  const [restaurantD, setRestaurantD] = useState<Restaurant | null>();
  const [state, formAction] = useFormState(postRestaurant, initialState);
  const path = usePathname();

  useEffect(() => {
    if (!userId) {
      let userId = localStorage.getItem('usedIdTemp');
      if (!userId) {
        userId = uuidv4();
        localStorage.setItem('usedIdTemp', userId as string);
      }
      setUserDId(userId as string);
    } else {
      setUserDId(userId);
    }
  }, [userId]);

  useEffect(() => {
    getRestaurant(userIdD).then((res) => {
      setRestaurantD(res);
    });
  }, [userIdD]);

  useEffect(() => {
    if (state?.message) {
      toast.success(state?.message);
      setRestaurantD(state.restaurant);
    }
  }, [state]);

  console.log('restaurantD', restaurantD);

  return (
    // eslint-disable-next-line react/jsx-no-bind
    <>
      <UserNoAuth />
      <form action={formAction}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            {restaurantD && <InfoAlert path={path} />}
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
                    defaultValue={restaurantD?.name || ''}
                    autoComplete="given-name"
                    className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="mt-2">
                  <input
                    type="hidden"
                    name="userId"
                    id="userId"
                    value={userIdD}
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
                    defaultValue={restaurantD?.address || ''}
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
                    defaultValue={restaurantD?.phone || ''}
                    autoComplete="given-phone"
                    className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="primaryColor"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Primary color
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    name="primaryColor"
                    id="primaryColor"
                    defaultValue={restaurantD?.primaryColor || '#4F46E5'}
                    className="h-9 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
                  />
                  <span className="text-sm text-gray-500">Used for accents and buttons</span>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="backgroundColor"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Background color
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    name="backgroundColor"
                    id="backgroundColor"
                    defaultValue={restaurantD?.backgroundColor || '#FFFFFF'}
                    className="h-9 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
                  />
                  <span className="text-sm text-gray-500">Menu page background</span>
                </div>
              </div>

              {restaurantD && (
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
                          `${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}` ||
                          ''
                        }
                      >
                        {`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}`}
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
                      <img src={restaurantD?.qrCode || ''} alt="" />
                    </div>

                    <div className="flex sm:col-span-2 gap-2 pl-4">
                      <FacebookShareButton
                        url={`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}`}
                      >
                        <FacebookIcon size={32} round />
                      </FacebookShareButton>

                      <WhatsappShareButton
                        url={`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}`}
                        title={`Menu ${restaurantD?.name}`}
                        separator=":: "
                      >
                        <WhatsappIcon size={32} round />
                      </WhatsappShareButton>
                      <TwitterShareButton
                        url={`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}`}
                        title={`Menu ${restaurantD?.name}`}
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
    </>
  );
}
