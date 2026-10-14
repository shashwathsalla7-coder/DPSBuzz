'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      // 1. Check localStorage for active session
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.username && user.username.toLowerCase() !== 'guest') {
          if (user.username.toLowerCase() === 'shashwath71845' && !localStorage.getItem('dpsbuzz_shashwath_authenticated')) {
            localStorage.removeItem('dpsbuzz_user');
            document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
            router.replace('/login');
            return;
          }
          // Keep cookie in sync for server routes & WebView
          document.cookie = `dpsbuzz_user=${encodeURIComponent(stored)}; path=/; max-age=31536000; SameSite=Lax`;
          router.replace('/home');
          return;
        }
      }

      // 2. Fallback: check cookie if localStorage was empty
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split('; ');
        const userCookie = cookies.find((c) => c.startsWith('dpsbuzz_user='));
        if (userCookie) {
          const raw = decodeURIComponent(userCookie.split('=')[1]);
          const user = JSON.parse(raw);
          if (user && user.username && user.username.toLowerCase() !== 'guest') {
            if (user.username.toLowerCase() === 'shashwath71845' && !localStorage.getItem('dpsbuzz_shashwath_authenticated')) {
              localStorage.removeItem('dpsbuzz_user');
              document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
              router.replace('/login');
              return;
            }
            localStorage.setItem('dpsbuzz_user', raw);
            router.replace('/home');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Session check on root page:', e);
    }

    // No session found - go to login
    setChecked(true);
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
