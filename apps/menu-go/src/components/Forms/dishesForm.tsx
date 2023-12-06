'use client';

import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'react-toastify';

import { postDish } from '../../app/actions';
import { IDish } from '../../types/dish';
import { IUser } from '../../types/user';
import SuccessMessage from '../Alerts';
import Uploader from '../Uploader';

const initialState = {
  message: null,
};

type IDishesForm = {
  user: IUser;
  categoryId: string;
  dish?: IDish | null;
};

export default function DishesForm({ user, categoryId, dish }: IDishesForm) {
  const [state, formAction] = useFormState(postDish, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      toast.success(state?.message);
      router.push('/panel/dishes');
    }
  }, [state, router]);

  return (
    // eslint-disable-next-line react/jsx-no-bind
    <>
      <form action={formAction}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Dishes
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Dishes information
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
                    defaultValue={dish?.name || ''}
                    autoComplete="given-name"
                    className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="mt-2">
                  <input
                    type="hidden"
                    name="categoryId"
                    id="categoryId"
                    value={categoryId}
                    autoComplete="given-name"
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
                <div className="mt-2">
                  <input
                    type="hidden"
                    name="dishId"
                    id="dishId"
                    value={dish?.id}
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Price
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="price"
                    id="price"
                    required
                    defaultValue={dish?.price || ''}
                    autoComplete="given-price"
                    className="block w-full rounded-md border-0 pl-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p aria-live="polite" className="sr-only" role="status">
          {state?.message && <SuccessMessage message={state?.message} />}
        </p>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="button"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Save
          </button>
        </div>
      </form>
      {dish && <Uploader dishId={dish.id} />}
    </>
  );
}
