import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg,#09090b)] flex flex-col justify-between p-6 text-[var(--text,#f4f4f5)]">
      {/* Top Wordmark */}
      <div className="max-w-md w-full mx-auto">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-xl">🐝</span>
          <span className="font-extrabold text-lg text-white tracking-tight">
            DPS Buzz
          </span>
        </Link>
      </div>

      {/* Main 404 block */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Notebook doodle */}
        <div className="w-16 h-16 rounded-[14px] bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
            <path d="M6 14h6" />
            <path d="M18 18l3 3" />
          </svg>
        </div>

        <div className="space-y-2 text-left">
          <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
            Error 404 · Page Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            This page isn&apos;t on the timetable.
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            The link might be mistyped, or the page may have been moved or removed.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Landing Page
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-850 hover:text-white transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-left">
        <p className="text-xs text-neutral-500">
          DPS Buzz • Student Community
        </p>
      </div>
    </div>
  );
}
