import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="w-full border-b border-[var(--line)] bg-[var(--bg)] backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl" role="img" aria-label="DPS Buzz Logo">
            🐝
          </span>
          <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[var(--primary)] transition-colors">
            DPS Buzz
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" aria-label="Public navigation">
          <Link
            href="/about"
            className="text-[var(--text)] hover:text-white px-2 py-1 rounded transition-colors"
          >
            About
          </Link>
          <Link
            href="/safety"
            className="text-[var(--text)] hover:text-white px-2 py-1 rounded transition-colors"
          >
            Safety
          </Link>
          <Link
            href="/download"
            className="text-[var(--text)] hover:text-white px-2 py-1 rounded transition-colors hidden xs:inline-block"
          >
            App
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-neutral-700 text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors font-medium"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--accent-cta)] via-[var(--accent-cta)] to-[var(--accent-cta)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
