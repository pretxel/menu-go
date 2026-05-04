/* eslint-disable @next/next/no-img-element */
'use client';

import 'react-toastify/dist/ReactToastify.css';

import { usePathname } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
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

const initialState = { message: null };

export default function Form({ userId }) {
  const [userIdD, setUserDId] = useState<string>('');
  const [restaurantD, setRestaurantD] = useState<Restaurant | null>();
  const [state, formAction] = useActionState(postRestaurant, initialState);
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
    getRestaurant(userIdD).then((res) => setRestaurantD(res));
  }, [userIdD]);

  useEffect(() => {
    if (state?.message) {
      toast.success(state?.message);
      setRestaurantD(state.restaurant);
    }
  }, [state]);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/r/${restaurantD?.slug || restaurantD?.id}`;

  return (
    <>
      <UserNoAuth />
      <form action={formAction} className="mt-6">
        <div className="card-brut p-6 sm:p-8">
          <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
                Section / 01
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Business profile
              </h2>
            </div>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/40 sm:inline">
              required
            </span>
          </div>

          {restaurantD && (
            <div className="mt-6">
              <InfoAlert path={path} />
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Restaurant name" name="name" required defaultValue={restaurantD?.name || ''} />
            <Field label="Address" name="address" required defaultValue={restaurantD?.address || ''} />
            <Field label="Phone" name="phone" required defaultValue={restaurantD?.phone || ''} />
            <input type="hidden" name="userId" value={userIdD} />

            <ColorField
              label="Primary color"
              name="primaryColor"
              defaultValue={restaurantD?.primaryColor || '#FF3B2E'}
              hint="Buttons and accents on your menu"
            />
            <ColorField
              label="Background color"
              name="backgroundColor"
              defaultValue={restaurantD?.backgroundColor || '#FAFAF5'}
              hint="Customer-facing menu background"
            />
          </div>
        </div>

        {restaurantD && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="card-brut p-6 sm:p-8">
              <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
                    Section / 02
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                    Public link
                  </h2>
                </div>
              </div>
              <div className="mt-6 break-all border-3 border-ink bg-bone p-4 font-mono text-xs">
                <a href={shareUrl} className="hover:underline">{shareUrl}</a>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  Share →
                </span>
                <FacebookShareButton url={shareUrl}>
                  <FacebookIcon size={36} round />
                </FacebookShareButton>
                <WhatsappShareButton url={shareUrl} title={`Menu ${restaurantD?.name}`} separator=":: ">
                  <WhatsappIcon size={36} round />
                </WhatsappShareButton>
                <TwitterShareButton url={shareUrl} title={`Menu ${restaurantD?.name}`}>
                  <XIcon size={36} round />
                </TwitterShareButton>
              </div>
            </div>

            <div id="qr-section" className="card-brut p-6 sm:p-8">
              <div className="flex items-baseline justify-between border-b-3 border-ink pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
                    Section / 03
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                    QR code
                  </h2>
                </div>
                <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/40 sm:inline">
                  print me
                </span>
              </div>
              <div className="mt-6 flex justify-center border-3 border-ink bg-paper p-4">
                {restaurantD?.qrCode ? (
                  <img src={restaurantD.qrCode} alt="qr" className="h-48 w-48 object-contain" />
                ) : (
                  <div className="grid h-48 w-48 place-items-center font-mono text-xs uppercase tracking-widest text-ink/40">
                    No QR yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p aria-live="polite" className="sr-only" role="status">
          {state?.message && <SuccessMessage message={state?.message} />}
        </p>

        <div className="sticky bottom-4 mt-8 flex justify-end">
          <button type="submit" className="btn-brut-primary text-sm">
            Save changes <span aria-hidden>→</span>
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
        {label}
        {required && <span className="text-tomato">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="input-brut mt-2"
      />
    </label>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-3 border-3 border-ink bg-paper px-3 py-2">
        <input
          type="color"
          name={name}
          defaultValue={defaultValue}
          className="h-10 w-16 cursor-pointer border-2 border-ink bg-paper p-0.5"
        />
        <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
          {hint}
        </span>
      </div>
    </label>
  );
}
