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
        if (parsed.username && !DUMMY_TEST_USERNAMES.has(parsed.username.toLowerCase())) {
          router.replace(`/u/${parsed.username}`);
          return;
        }
      }
    } catch {}
    const cur = DataStore.getCurrentUser();
    if (cur && cur.username && !DUMMY_TEST_USERNAMES.has(cur.username.toLowerCase())) {
      router.replace(`/u/${cur.username}`);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
      Opening profile...
    </div>
  );
}
