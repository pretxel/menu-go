import type { Metadata } from 'next';
import Link from 'next/link';

import CatalogFunnel from '../../components/CatalogFunnel';

export const metadata: Metadata = {
  title: 'Create your free catalog',
  description:
    'Snap a photo of your menu — we extract every dish and give you a QR-linked page to share.',
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <header className="border-b-3 border-ink bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border-3 border-ink bg-tomato text-paper shadow-brut-sm font-display text-xl font-extrabold">
              D
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">DINEQRS</span>
          </Link>
          <Link href="/login" className="btn-brut text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <CatalogFunnel />
    </div>
  );
}
