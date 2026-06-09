'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { RiFacebookFill } from 'react-icons/ri';

// Only forward relative callback paths — anything absolute could be an open
// redirect. Default stays the panel.
function targetCallbackUrl(): string {
  const raw = new URLSearchParams(window.location.search).get('callbackUrl');
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/panel';
}

export default function Login() {
  const handleClick = () => signIn('facebook', { callbackUrl: targetCallbackUrl() });
  const handleClickGmail = () => signIn('google', { callbackUrl: targetCallbackUrl() });

  return (
    <div className="relative flex min-h-screen flex-1 bg-paper text-ink">
      {/* left form panel */}
      <div className="relative flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-20 xl:px-24">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border-3 border-ink bg-tomato text-paper shadow-brut-sm font-display text-xl font-extrabold">
            D
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            DINEQRS
          </span>
        </Link>

        <div className="my-auto py-12">
          <div className="mx-auto w-full max-w-md">
            <span className="inline-flex items-center gap-2 border-3 border-ink bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] shadow-brut-sm">
              <span className="h-2 w-2 rounded-full bg-tomato" />
              Sign in
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[0.95] tracking-tight">
              Welcome <span className="bg-lime px-2">back</span>.
            </h2>
            <p className="mt-4 max-w-sm font-mono text-sm leading-relaxed text-ink/70">
              Pick your provider. We don&apos;t need a password — just a click.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleClickGmail}
                className="group flex items-center justify-center gap-3 border-3 border-ink bg-paper px-4 py-4 shadow-brut transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
              >
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.28826 8.39085L2.82415 10.1235L1.12782 10.1593C0.620865 9.21906 0.333313 8.14325 0.333313 7.00002C0.333313 5.89453 0.602167 4.85202 1.07873 3.93408H1.07909L2.5893 4.21096L3.25086 5.7121C3.1124 6.11578 3.03693 6.54911 3.03693 7.00002C3.03698 7.4894 3.12563 7.95828 3.28826 8.39085Z" fill="#FBBB00" />
                  <path d="M13.5502 5.75455C13.6267 6.15783 13.6667 6.57431 13.6667 6.99996C13.6667 7.47726 13.6165 7.94283 13.5209 8.39192C13.1963 9.92012 12.3483 11.2545 11.1736 12.1989L11.1733 12.1985L9.27108 12.1014L9.00186 10.4208C9.78134 9.96371 10.3905 9.24832 10.7114 8.39192H7.14655V5.75455H10.7634H13.5502Z" fill="#518EF8" />
                  <path d="M11.1732 12.1986L11.1736 12.1989C10.0311 13.1172 8.57981 13.6667 6.99997 13.6667C4.46114 13.6667 2.25382 12.2476 1.12781 10.1594L3.28825 8.39087C3.85124 9.89342 5.3007 10.963 6.99997 10.963C7.73036 10.963 8.41463 10.7656 9.00179 10.4209L11.1732 12.1986Z" fill="#28B446" />
                  <path d="M11.2553 1.86812L9.09558 3.63624C8.4879 3.2564 7.76957 3.03697 6.99999 3.03697C5.26225 3.03697 3.78569 4.15565 3.2509 5.71208L1.0791 3.93406H1.07874C2.18827 1.79486 4.42342 0.333328 6.99999 0.333328C8.61756 0.333328 10.1007 0.909526 11.2553 1.86812Z" fill="#F14336" />
                </svg>
                <span className="font-display text-sm font-extrabold uppercase tracking-tight">
                  Google
                </span>
              </button>

              <button
                type="button"
                onClick={handleClick}
                className="group flex items-center justify-center gap-3 border-3 border-ink bg-sky px-4 py-4 shadow-brut transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
              >
                <RiFacebookFill className="h-5 w-5 text-ink" />
                <span className="font-display text-sm font-extrabold uppercase tracking-tight">
                  Facebook
                </span>
              </button>
            </div>

            <div className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-ink/50">
              <span className="h-px flex-1 bg-ink/30" />
              By signing in, you agree to our terms
              <span className="h-px flex-1 bg-ink/30" />
            </div>
          </div>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-ink/60">
          ← <Link href="/" className="hover:underline">Back to home</Link>
        </p>
      </div>

      {/* right image panel */}
      <div className="relative hidden flex-1 border-l-3 border-ink lg:block">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/login/burguer-login.webp"
          alt="burger"
          fill
          priority
        />
        <div className="absolute inset-0 bg-tomato/15" />
        <div className="absolute bottom-10 left-10 right-10">
          <div className="card-brut bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
              Manifesto
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight">
              Print one QR. Update the menu forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
