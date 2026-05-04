'use client';
import 'focus-visible';
import '../../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider, signOut } from 'next-auth/react';
import React from 'react';
import { ToastContainer } from 'react-toastify';

import Nav from '../../components/Panel/Nav';

const navigation = [{ name: 'Config', href: '/panel', current: false }];
const userNavigation = [
  { name: 'Sign out', href: '#', callback: () => signOut() },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastContainer
        autoClose={3000}
        toastClassName={() =>
          'border-3 border-ink bg-paper text-ink shadow-brut p-4 font-mono text-sm relative flex justify-between'
        }
      />
      <div className="min-h-screen bg-paper text-ink">
        <Nav navigation={navigation} userNavigation={userNavigation} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <Analytics />
    </SessionProvider>
  );
}
