'use client';

import { useSession } from 'next-auth/react';

export const User = () => {
  const { data: session } = useSession();

  console.log(session);
  return (
    <>
      <div className="ml-3">
        <div className="text-base font-medium text-gray-800">
          {session?.user?.name}
          Hola
        </div>
        <div className="text-sm font-medium text-gray-500">
          {session?.user?.email}
        </div>
      </div>
    </>
  );
};
