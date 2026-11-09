'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Public paths within the (main) route group
  const isPublicRoute =
    pathname === '/download' ||
    pathname.startsWith('/download') ||
    pathname.startsWith('/admin/login');

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(isPublicRoute);

  useEffect(() => {
    setIsMounted(true);
    if (isPublicRoute) {
      setIsAuthorized(true);
      return;
    }

    const toLogin = () => {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      const loginRedirect =
        currentPath && currentPath !== '/login' && currentPath !== '/signup'
          ? `/login?redirect=${encodeURIComponent(currentPath)}&logout=true`
          : '/login?logout=true';
      setIsAuthorized(false);
      try {
        localStorage.removeItem('dpsbuzz_user');
        localStorage.removeItem('dpsbuzz_shashwath_authenticated');
      } catch {}
      router.replace(loginRedirect);
    };

    // Show the app immediately when this browser already has a saved login.
    // The server (proxy) has already let this page through with a valid session;
    // verifySession below still double-checks in the background.
    try {
      const cachedUser = JSON.parse(localStorage.getItem('dpsbuzz_user') || 'null');
      if (cachedUser?.username && document.cookie.includes('dpsbuzz_user=')) {
        setIsAuthorized(true);
      }
    } catch {}

    // The signed server session is the source of truth. The copy of the profile in
    // localStorage is only a cache, rebuilt from the server when missing or stale.
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const session = res.ok ? await res.json() : null;
        if (!session?.authenticated) {
          toLogin();
          return;
        }

        let cached: { username?: string } | null = null;
        try {
          cached = JSON.parse(localStorage.getItem('dpsbuzz_user') || 'null');
        } catch {}

        if (!cached?.username || cached.username.toLowerCase() !== session.username) {
          const pr = await fetch(`/api/auth/profile?username=${encodeURIComponent(session.username)}`, {
            cache: 'no-store',
          });
          const pd = pr.ok ? await pr.json() : null;
          const profile = pd?.profile || { id: session.id, username: session.username, fullName: session.username };
          localStorage.setItem('dpsbuzz_user', JSON.stringify({ ...profile, role: session.role }));
        }

        if (session.role === 'admin') {
          localStorage.setItem('dpsbuzz_shashwath_authenticated', 'true');
        } else {
          localStorage.removeItem('dpsbuzz_shashwath_authenticated');
        }

        setIsAuthorized(true);
      } catch {
        // Network hiccup: keep showing the app if we already have a cached profile.
        if (localStorage.getItem('dpsbuzz_user')) {
          setIsAuthorized(true);
        } else {
          toLogin();
        }
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

  if (!isMounted || !isAuthorized) {
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
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--accent-cta)] via-[var(--accent-cta)] to-[var(--gold)] p-[3px] animate-spin">
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
