'use client';
import 'focus-visible';
import '../../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { ToastContainer } from 'react-toastify';

export default function Layout({ children }) {
  return (
    <>
      <ToastContainer autoClose={3000} />
      <div className="min-h-full">
        <div className="py-2">
          <main>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Analytics />
    </>
  );
}
