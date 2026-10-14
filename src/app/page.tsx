'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
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
