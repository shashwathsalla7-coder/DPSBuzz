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
    // Never allow unauthorized SSR leaks for private app pages
    if (typeof window === 'undefined') return false;
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
        const currentPath =
          typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const loginRedirect =
          currentPath && currentPath !== '/login' && currentPath !== '/signup'
            ? `/login?redirect=${encodeURIComponent(currentPath)}`
            : '/login';

        const stored = localStorage.getItem('dpsbuzz_user');
        if (!stored) {
          setIsAuthorized(false);
          router.replace(loginRedirect);
          return;
        }

        const u = JSON.parse(stored);
        if (!u || !u.username || u.username.toLowerCase() === 'guest') {
          setIsAuthorized(false);
          router.replace(loginRedirect);
          return;
        }

        if (u.username.toLowerCase() === 'shashwath71845') {
          const isAuth = localStorage.getItem('dpsbuzz_shashwath_authenticated');
          if (isAuth !== 'true') {
            setIsAuthorized(false);
            localStorage.removeItem('dpsbuzz_user');
            document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
            router.replace(loginRedirect);
            return;
          }
        }

        // Keep session cookie synchronized with localStorage for server middleware
        try {
          const sessionPayload = encodeURIComponent(
            JSON.stringify({ id: u.id, username: u.username, role: u.role || 'student' })
          );
          document.cookie = `dpsbuzz_user=${sessionPayload}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {}

        setIsAuthorized(true);
      } catch {
        const currentPath =
          typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const loginRedirect =
          currentPath && currentPath !== '/login' && currentPath !== '/signup'
            ? `/login?redirect=${encodeURIComponent(currentPath)}`
            : '/login';
        setIsAuthorized(false);
        router.replace(loginRedirect);
      }
    };

    verifySession();

    // Auto-refresh session and reload data seamlessly when returning from idle
    const handleReturnFromIdle = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        verifySession();
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'resume_from_idle' } }));
      }
    };

    // Automatic silent recovery on deployment ChunkLoadError
    const handleGlobalError = (event: ErrorEvent) => {
      if (event?.message && /Loading chunk|ChunkLoadError/i.test(event.message)) {
        const reloaded = sessionStorage.getItem('dpsbuzz_chunk_reloaded');
        if (!reloaded) {
          sessionStorage.setItem('dpsbuzz_chunk_reloaded', 'true');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', verifySession);
    document.addEventListener('visibilitychange', handleReturnFromIdle);
    window.addEventListener('focus', handleReturnFromIdle);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('storage', verifySession);
      document.removeEventListener('visibilitychange', handleReturnFromIdle);
      window.removeEventListener('focus', handleReturnFromIdle);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isPublicRoute, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-[3px] animate-spin">
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
