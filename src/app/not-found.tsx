import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between p-6 text-[var(--text)]">
      {/* Top Wordmark */}
      <div className="max-w-md w-full mx-auto">
        <span className="font-display font-extrabold text-lg text-[var(--text)] tracking-tight">
          DPS Buzz
        </span>
      </div>

      {/* Main 404 block: Left-aligned with subtle doodle per DESIGN.md Section 9.9 */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Subtle school notebook doodle (Section 7) */}
        <div className="w-16 h-16 rounded-[14px] bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center text-[var(--text-muted)]">
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
          <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Error 404 · Missing Page
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--text)] font-display tracking-tight">
            This page isn't on the timetable.
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            The link might be wrong, or the post was removed by the author.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/home"
            className="inline-flex items-center justify-center h-12 px-6 rounded-[12px] bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-left">
        <p className="text-xs text-[var(--text-muted)]">
          Dilsukhnagar Public School
        </p>
      </div>
    </div>
  );
}
