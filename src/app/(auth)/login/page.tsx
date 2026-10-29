'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { school } from '@/config/school';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeSession, setActiveSession] = useState<{ username: string; fullName: string } | null>(null);
  const [redirectParam, setRedirectParam] = useState<string | null>(null);

  // Read destination redirect link from URL if user tried accessing a deep link
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const red = params.get('redirect');
        if (red && red.startsWith('/') && !red.startsWith('//')) {
          setRedirectParam(red);
          try {
            router.prefetch(red);
          } catch {}
          return;
        }
      }
      router.prefetch('/home');
    } catch {}
  }, [router]);

  // Check active session without forcing an auto-redirect away from login screen
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === 'true') {
          localStorage.removeItem('dpsbuzz_user');
          localStorage.removeItem('dpsbuzz_shashwath_authenticated');
          document.cookie = 'dpsbuzz_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          setActiveSession(null);
          return;
        }
      }

      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.username && u.username.toLowerCase() !== 'guest') {
          if (u.username.toLowerCase() === 'shashwath71845' && !localStorage.getItem('dpsbuzz_shashwath_authenticated')) {
            localStorage.removeItem('dpsbuzz_user');
            document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
            setActiveSession(null);
            return;
          }
          setActiveSession(u);
        }
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usernameInput.trim() || !password) {
      setError('Fill in both fields to continue.');
      return;
    }

    setIsLoading(true);

    const cleanInput = usernameInput.trim().toLowerCase().replace(/^@+/, '');

    // Shashwath Super Administrator credentials check (restricted strictly to true admin)
    if (cleanInput === 'shashwath71845') {
      if (password === '71845shashwath123') {
        const superAdmin = {
          id: 'admin-shashwath-id',
          username: 'shashwath71845',
          fullName: 'Shashwath Salla',
          role: 'admin',
          isVerified: true,
          isApproved: true,
          avatar: null,
          bio: 'DPS Buzz Super Administrator 🛡️ • Full Systems & Moderation Access',
          class: 'Staff',
          section: 'Admin',
          followerCount: 0,
          followingCount: 0,
          postCount: 1,
          spiritPoints: 0,
          createdAt: '2026-10-01T00:00:00.000Z',
        };
        localStorage.setItem('dpsbuzz_shashwath_authenticated', 'true');
        localStorage.setItem('dpsbuzz_user', JSON.stringify(superAdmin));
        const adminSessionCookie = encodeURIComponent(JSON.stringify({ id: superAdmin.id, username: superAdmin.username, role: superAdmin.role }));
        document.cookie = `dpsbuzz_user=${adminSessionCookie}; path=/; max-age=31536000; SameSite=Lax`;

        try {
          localStorage.removeItem('dpsbuzz_chat_conversations_v2');
          localStorage.removeItem('dpsbuzz_chat_messages_v1');
          sessionStorage.clear();
        } catch {}

        // Ensure in profiles list and server
        const profiles = JSON.parse(localStorage.getItem('dpsbuzz_profiles_v2') || '[]');
        if (!profiles.some((p: any) => p.username === 'shashwath71845')) {
          profiles.unshift(superAdmin);
          localStorage.setItem('dpsbuzz_profiles_v2', JSON.stringify(profiles));
        }

        fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: superAdmin }),
        }).catch(() => {});

        // Instant client-side transition to intended link or /home
        const destination =
          redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : '/home';
        router.replace(destination);
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
            window.location.replace(destination);
          }
        }, 350);
        return;
      } else {
        setError('Incorrect password for administrator shashwath71845.');
        setIsLoading(false);
        return;
      }
    }

    // Check banned status
    const bannedUsers = JSON.parse(localStorage.getItem('dpsbuzz_banned_users_v1') || '[]');
    if (bannedUsers.includes(cleanInput)) {
      setError('This account has been banned by school administration for community violations.');
      setIsLoading(false);
      return;
    }

    // Check DataStore profiles locally first
    let profiles = JSON.parse(localStorage.getItem('dpsbuzz_profiles_v2') || '[]');
    let match = profiles.find(
      (p: any) =>
        (p.username || '').toLowerCase().replace(/^@+/, '') === cleanInput ||
        (p.fullName || '').toLowerCase() === cleanInput
    );

    // If not found in localStorage, fetch from authoritative /api/auth/profile (checks Cloudflare D1 + Supabase + ServerStore fast)
    if (!match) {
      try {
        const profRes = await fetch(`/api/auth/profile?username=${encodeURIComponent(cleanInput)}`, { cache: 'no-store' });
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.success && profData.profile) {
            match = profData.profile;
            const updated = [...profiles.filter((p: any) => (p.username || '').toLowerCase() !== cleanInput), match];
            localStorage.setItem('dpsbuzz_profiles_v2', JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.warn('Database profile lookup notice:', e);
      }
    }

    if (!match) {
      setError("We couldn't find an account with that username. Please check your spelling or sign up first.");
      setIsLoading(false);
      return;
    }

    if (bannedUsers.includes(match.username.toLowerCase())) {
      setError('This account has been suspended by school administration.');
      setIsLoading(false);
      return;
    }

    try {
      localStorage.removeItem('dpsbuzz_chat_conversations_v2');
      localStorage.removeItem('dpsbuzz_chat_messages_v1');
      sessionStorage.clear();
    } catch {}

    localStorage.setItem('dpsbuzz_user', JSON.stringify(match));
    const userSessionCookie = encodeURIComponent(JSON.stringify({ id: match.id, username: match.username, role: match.role || 'student' }));
    document.cookie = `dpsbuzz_user=${userSessionCookie}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Fast client-side navigation to intended link or /home
    const destination =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/home';
    router.replace(destination);
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
        window.location.replace(destination);
      }
    }, 350);
  };

  return (
    <div className="w-full space-y-6">
      {/* Official Poster Brand Logo & Tagline */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <Logo size="xl" className="justify-center" />
        <div className="space-y-0.5">
          <p
            className="text-sm font-extrabold tracking-tight"
            style={{
              fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
              color: 'var(--text)',
            }}
          >
            Your School. Your People. Your Buzz.
          </p>
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            More Than Just School 🙂 • {school.schoolName}
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div
        className="p-6 rounded-2xl border space-y-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            Log in
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Enter your student username to continue
          </p>
        </div>

        {/* Notice when accessing a protected app link without being logged in */}
        {redirectParam && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <span className="text-base shrink-0">🔒</span>
            <div>
              <p className="font-bold text-amber-300">Account Required to Access Link</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                You must have an account and be logged in to view content on DPSBuzz.
              </p>
            </div>
          </div>
        )}

        {activeSession && (
          <div
            className="p-3 rounded-xl border flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
            }}
          >
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                Active: @{activeSession.username}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                You are currently logged in on this browser
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('dpsbuzz_user');
                  localStorage.removeItem('dpsbuzz_shashwath_authenticated');
                  document.cookie = 'dpsbuzz_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
                  setActiveSession(null);
                }}
                className="px-2.5 py-1 rounded-lg border text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Log Out
              </button>
              <Link
                href={redirectParam || '/home'}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
              >
                {redirectParam ? 'Continue to Link →' : 'Go Home'}
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="usernameInput"
              className="block text-xs font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Username
            </label>
            <input
              id="usernameInput"
              type="text"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-12 pl-3.5 pr-11 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-sm font-semibold transition btn-press flex items-center justify-center cursor-pointer shadow-sm hover:opacity-95"
            style={{
              backgroundColor: 'var(--accent-cta)',
              color: 'var(--on-accent-cta)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--line)' }}>
          <span style={{ color: 'var(--text-muted)' }}>New student here? </span>
          <Link
            href={
              redirectParam
                ? `/signup?redirect=${encodeURIComponent(redirectParam)}`
                : '/signup'
            }
            className="font-semibold hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Create an account / Sign up ✨
          </Link>
        </div>
      </div>
    </div>
  );
}
