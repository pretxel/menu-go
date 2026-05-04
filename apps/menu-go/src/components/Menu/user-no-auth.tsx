'use client';

import { useEffect, useState } from 'react';

export default function UserNoAuth() {
  const [showLogin, setShowLogin] = useState(false);
  const [userDId, setUserDId] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('usedIdTemp');
    if (userId) {
      setUserDId(userId as string);
      setShowLogin(true);
    }
  }, []);

  if (!showLogin) return null;

  return (
    <div className="border-b-3 border-ink bg-ink px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-paper">
          ◆ Demo session active
        </p>
        <a
          href={`/login?referalId=${userDId}`}
          className="inline-flex items-center gap-2 border-2 border-paper bg-tomato px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-transform hover:-translate-y-0.5"
        >
          Login <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
