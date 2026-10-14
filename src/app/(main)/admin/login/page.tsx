'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { schoolConfig } from '@/config/school';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (password === '71845shashwath123') {
        const adminUser = {
          id: 'admin-shashwath-id',
          username: 'shashwath71845',
          fullName: 'Shashwath (Admin)',
          role: 'admin',
          avatar: null,
          isVerified: true,
          isApproved: true,
          class: 'Staff',
          section: 'Admin',
        };
        localStorage.setItem('dpsbuzz_user', JSON.stringify(adminUser));
        router.push('/admin');
      } else {
        setError('Incorrect administrator password. Access restricted to Admin ID: @shashwath71845.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between px-4 py-8">
      {/* Top Bar */}
      <div className="max-w-sm mx-auto w-full">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to DPS Buzz</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-sm mx-auto w-full my-auto space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text-muted)] font-mono">
            <Shield size={12} className="text-[var(--primary)]" />
            <span>Staff Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] font-display tracking-tight">
            Admin Console
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Dilsukhnagar Public School administration access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Administrator Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full h-12 px-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
              />
            </div>
            {error && (
              <p className="text-xs text-[var(--danger)] pt-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-[12px] bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Log in to Console'}
          </button>
        </form>

        <div className="p-3.5 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-semibold text-[var(--text)]">Admin Notice</p>
          <p>
            Authorized school faculty and computer lab in-charges only. All actions are logged.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-sm mx-auto w-full text-center">
        <p className="text-xs text-[var(--text-muted)]">
          {schoolConfig.siteName} · {schoolConfig.schoolName}
        </p>
      </div>
    </div>
  );
}
