'use client';

import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { postDish } from '../../app/actions';
import { IDish } from '../../types/dish';
import SuccessMessage from '../Alerts';
import Uploader from '../Uploader';

type FormState = {
  message: string | null;
  fieldErrors?: Record<string, string[]>;
  requiresAuth?: boolean;
};

const initialState: FormState = { message: null };

type CategoryLite = { name: string; description?: string | null };

type IDishesForm = {
  categoryId: string;
  dish?: IDish | null;
  category?: CategoryLite | null;
};

export default function DishesForm({ categoryId, dish, category }: IDishesForm) {
  const [state, formAction] = useActionState(postDish, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.requiresAuth) {
      router.push('/login');
      return;
    }
    if (state?.message) {
      toast.success(state.message);
      router.back();
    }
  }, [state, router]);

  return (
    <>
      <form action={formAction} className="mt-6">
        <div className="card-brut p-6 sm:p-8">
          <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
                Category / {category?.name}
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {category?.name}
              </h2>
              {category?.description && (
                <p className="mt-2 font-mono text-sm text-ink/70">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <label htmlFor="name" className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                Name <span className="text-tomato">*</span>
              </span>
              <input
                type="text"
                id="name"
                name="name"
                aria-label="Name"
                aria-invalid={Boolean(state?.fieldErrors?.name?.[0])}
                required
                defaultValue={dish?.name || ''}
                className="input-brut mt-2"
              />
              {state?.fieldErrors?.name?.[0] && (
                <span className="mt-1 block font-mono text-xs text-tomato">
                  {state.fieldErrors.name[0]}
                </span>
              )}
            </label>

            <label htmlFor="price" className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                Price <span className="text-tomato">*</span>
              </span>
              <div className="mt-2 flex items-stretch border-3 border-ink bg-paper">
                <span className="grid place-items-center border-r-3 border-ink bg-lime px-3 font-display text-base font-extrabold">
                  $
                </span>
                <input
                  type="text"
                  id="price"
                  name="price"
                  required
                  aria-invalid={Boolean(state?.fieldErrors?.price?.[0])}
                  defaultValue={dish?.price || ''}
                  className="block w-full bg-paper px-4 py-3 font-mono text-ink placeholder:text-ink/40 focus:outline-hidden"
                />
              </div>
              {state?.fieldErrors?.price?.[0] && (
                <span className="mt-1 block font-mono text-xs text-tomato">
                  {state.fieldErrors.price[0]}
                </span>
              )}
            </label>

            <input type="hidden" id="categoryId" name="categoryId" value={categoryId} readOnly />
            <input type="hidden" id="dishId" name="dishId" value={dish?.id || ''} readOnly />

            <label htmlFor="description" className="block sm:col-span-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                Description <span className="text-tomato">*</span>
              </span>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={dish?.description || ''}
                className="input-brut mt-2 resize-y"
              />
            </label>
          </div>
        </div>

        <p aria-live="polite" className="sr-only" role="status">
          {state?.message && <SuccessMessage message={state.message} />}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
          <button
            type="button"
            className="btn-brut text-sm"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button type="submit" className="btn-brut-primary text-sm">
            Save
          </button>
        </div>
      </form>

      {dish && (
        <div className="mt-8">
          <Uploader dishId={dish.id} />
        </div>
      )}
    </>
  );
}
