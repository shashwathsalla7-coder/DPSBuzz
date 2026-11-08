import Link from 'next/link';

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[var(--bg)] py-12 px-4 text-[var(--text-muted)] text-xs">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐝</span>
            <span className="font-bold text-[var(--text)] text-sm">DPS Buzz</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-muted)]">School Social Media App</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" aria-label="Footer links">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-[var(--text)] transition-colors">
              About
            </Link>
            <Link href="/safety" className="hover:text-[var(--text)] transition-colors">
              Safety &amp; Cyber Rules
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">
              Terms of Use
            </Link>
            <Link href="/contact" className="hover:text-[var(--text)] transition-colors">
              Contact
            </Link>
            <Link href="/download" className="hover:text-[var(--text)] transition-colors">
              Download App
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--text-muted)] text-xs">
          <p>© {year} DPS Buzz. The official school social media app for students.</p>
          <p>Private &amp; moderated space for classes 6–10.</p>
        </div>
      </div>
    </footer>
  );
}
