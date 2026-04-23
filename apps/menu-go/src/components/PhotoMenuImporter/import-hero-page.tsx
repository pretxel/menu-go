'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PhotoMenuImporter from './index';

type Props = {
  userId: string;
};

export default function ImportHeroPage({ userId }: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add your dishes</h1>
      <p className="text-sm text-gray-500 mb-8">
        The fastest way: snap a photo of your paper menu. We&apos;ll read it for you.
      </p>
      <PhotoMenuImporter
        userId={userId}
        alwaysOpen
        onImportSuccess={() => router.push('/panel/dishes')}
      />
      <div className="mt-6 text-center">
        <Link
          href="/panel/dishes"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Add dishes manually →
        </Link>
      </div>
    </div>
  );
}
