import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl" role="img" aria-label="DPSBus Logo">
            🐝
          </span>
          <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            DPSBus
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" aria-label="Public navigation">
          <Link
            href="/about"
            className="text-neutral-300 hover:text-white px-2 py-1 rounded transition-colors"
          >
            About
          </Link>
          <Link
            href="/safety"
            className="text-neutral-300 hover:text-white px-2 py-1 rounded transition-colors"
          >
            Safety
          </Link>
          <Link
            href="/download"
            className="text-neutral-300 hover:text-white px-2 py-1 rounded transition-colors hidden xs:inline-block"
          >
            App
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-200 hover:bg-neutral-800 transition-colors font-medium"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
