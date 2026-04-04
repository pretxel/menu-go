'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-gray-600">Menu not found.</p>
      <button
        onClick={reset}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Try again
      </button>
    </div>
  );
}
