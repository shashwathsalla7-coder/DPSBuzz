'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { school } from '@/config/school';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeSession, setActiveSession] = useState<{ username: string; fullName: string } | null>(null);

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

    const cleanInput = usernameInput.trim().toLowerCase();

    // Shashwath Super Administrator credentials check
    if (cleanInput === 'shashwath71845' || cleanInput === 'dps71845') {
      if (password === '71845shashwath123' || password.toUpperCase() === 'DPS71845' || password === '71845') {
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
        document.cookie = `dpsbuzz_user=${encodeURIComponent(JSON.stringify(superAdmin))}; path=/; max-age=31536000; SameSite=Lax`;

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

        window.location.replace('/home');
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
        p.username.toLowerCase() === cleanInput ||
        p.fullName.toLowerCase() === cleanInput
    );

    // If not found in localStorage, fetch from server store to sync account from Web
    if (!match) {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const syncData = await res.json();
          if (syncData.profiles && Array.isArray(syncData.profiles)) {
            match = syncData.profiles.find(
              (p: any) =>
                p.username.toLowerCase() === cleanInput ||
                p.fullName.toLowerCase() === cleanInput
            );
            if (match) {
              localStorage.setItem('dpsbuzz_profiles_v2', JSON.stringify(syncData.profiles));
            }
          }
        }
      } catch (e) {
        console.warn('Server sync lookup failed:', e);
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
    document.cookie = `dpsbuzz_user=${encodeURIComponent(JSON.stringify(match))}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.replace('/home');
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
                href="/home"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
              >
                Go Home
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
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
            />
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
            href="/signup"
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
