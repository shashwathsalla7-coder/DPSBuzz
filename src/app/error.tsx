'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn('[DPS Buzz Error Boundary] Handled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--surface,#0B0E14)] text-[var(--text,#F1F5F9)] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
        <ShieldAlert size={32} />
      </div>

      <h1 className="text-xl font-extrabold mb-2 font-display">Something went wrong</h1>
      <p className="text-xs text-[var(--text-muted,#94A3B8)] max-w-sm mb-6 leading-relaxed">
        DPS Buzz encountered a temporary issue. Tap &ldquo;Try Again&rdquo; or return to your home feed.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-full text-xs font-bold bg-[var(--primary,#007AFF)] text-white hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RotateCw size={14} />
          <span>Try Again</span>
        </button>

        <Link
          href="/home"
          className="px-5 py-2.5 rounded-full text-xs font-semibold border border-[var(--line,#1F293D)] bg-[var(--surface-sunken,#161E2E)] text-[var(--text,#F1F5F9)] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          <Home size={14} />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
}
