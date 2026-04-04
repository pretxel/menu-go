'use client';
import 'focus-visible';
import '../../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider, signOut } from 'next-auth/react';
import React from 'react';
import { ToastContainer } from 'react-toastify';

import Nav from '../../components/Panel/Nav';

const navigation = [
  { name: 'Config', href: '/panel', current: false },
  // { name: 'Dishes', href: '/panel/dishes', current: false },
];
const userNavigation = [
  { name: 'Sign out', href: '#', callback: () => signOut() },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
        <ToastContainer autoClose={3000} />
        <div className="min-h-full">
          <Nav navigation={navigation} userNavigation={userNavigation} />

          <div className="py-2">
            <main>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Analytics />
      </SessionProvider>
    </>
  );
}
