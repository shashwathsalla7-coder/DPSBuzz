'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DataStore } from '@/lib/dataStore';

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Public paths within the (main) route group
  const isPublicRoute =
    pathname === '/download' ||
    pathname.startsWith('/download') ||
    pathname.startsWith('/admin/login');

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isPublicRoute) return true;

    try {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.username && u.username.toLowerCase() !== 'guest') {
          if (u.username.toLowerCase() === 'shashwath71845') {
            return localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true';
          }
          return true;
        }
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthorized(true);
      return;
    }

    const verifySession = () => {
      try {
        const stored = localStorage.getItem('dpsbuzz_user');
        if (!stored) {
          setIsAuthorized(false);
          router.replace('/login');
          return;
        }

        const u = JSON.parse(stored);
        if (!u || !u.username || u.username.toLowerCase() === 'guest') {
          setIsAuthorized(false);
          router.replace('/login');
          return;
        }

        if (u.username.toLowerCase() === 'shashwath71845') {
          const isAuth = localStorage.getItem('dpsbuzz_shashwath_authenticated');
          if (isAuth !== 'true') {
            setIsAuthorized(false);
            localStorage.removeItem('dpsbuzz_user');
            document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
            router.replace('/login');
            return;
          }
        }

        setIsAuthorized((prev) => (prev ? prev : true));
        DataStore.syncWithServer().catch(() => {});
      } catch {
        setIsAuthorized(false);
        router.replace('/login');
      }
    };

    verifySession();
    window.addEventListener('storage', verifySession);
    return () => window.removeEventListener('storage', verifySession);
  }, [isPublicRoute, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-[3px] animate-spin">
            <div className="w-full h-full bg-black rounded-full" />
          </div>
          <span className="absolute text-2xl">🐝</span>
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-neutral-400">
          DPS Buzz • Verifying session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-[3px] animate-spin">
              <div className="w-full h-full bg-black rounded-full" />
            </div>
            <span className="absolute text-2xl">🐝</span>
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-neutral-400">
            DPS Buzz • Loading...
          </p>
        </div>
      }
    >
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}

export default AuthGuard;
