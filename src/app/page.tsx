'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.username && u.username.toLowerCase() !== 'guest') {
          if (u.username.toLowerCase() === 'shashwath71845') {
            if (localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true') {
              router.replace('/home');
              return;
            }
          } else {
            router.replace('/home');
            return;
          }
        }
      }
    } catch {}
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-[3px] animate-spin">
          <div className="w-full h-full bg-black rounded-full" />
        </div>
        <span className="absolute text-2xl">🐝</span>
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-neutral-400">
        DPS Buzz • Starting up...
      </p>
    </div>
  );
}
