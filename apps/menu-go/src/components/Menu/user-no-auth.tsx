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
      <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gray-50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <a href={`/login?referalId=${userDId}`}>Login</a>
      </div>
    );
  }

  return <></>;
}
