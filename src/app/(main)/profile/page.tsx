'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataStore, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.username &&
          parsed.username.toLowerCase() !== 'guest' &&
          !DUMMY_TEST_USERNAMES.has(parsed.username.toLowerCase())
        ) {
          if (parsed.username.toLowerCase() === 'shashwath71845') {
            if (localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true') {
              router.replace(`/u/${parsed.username}`);
              return;
            }
          } else {
            router.replace(`/u/${parsed.username}`);
            return;
          }
        }
      }
    } catch {}

    const cur = DataStore.getCurrentUser();
    if (
      cur &&
      cur.username &&
      cur.username.toLowerCase() !== 'guest' &&
      !DUMMY_TEST_USERNAMES.has(cur.username.toLowerCase())
    ) {
      if (cur.username.toLowerCase() === 'shashwath71845') {
        if (localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true') {
          router.replace(`/u/${cur.username}`);
          return;
        }
      } else {
        router.replace(`/u/${cur.username}`);
        return;
      }
    }

    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-3" />
      <p className="text-xs text-neutral-400 font-medium">Opening profile...</p>
    </div>
  );
}
