'use client';

import { useEffect, useState } from 'react';

export default function UserNoAuth() {
  const [showLogin, setShowLogin] = useState(false);
  const [userDId, setUserDId] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('usedIdTemp');
    if (userId) {
      console.log('SHOW LOGIN');
      setUserDId(userId as string);
      setShowLogin(true);
    }
  }, []);

  if (showLogin) {
    return (
      <div className="flex items-center gap-x-6 bg-gray-900 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <p className="text-sm leading-6 text-white">
          <a href="#">
            <strong className="font-semibold">
              <a href={`/login?referalId=${userDId}`}>Login</a>
            </strong>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
      </div>
    );
  }

  return <></>;
}
