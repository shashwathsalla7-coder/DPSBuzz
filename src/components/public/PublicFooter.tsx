import Link from 'next/link';

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-neutral-850 bg-neutral-950 py-12 px-4 text-neutral-400 text-xs">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐝</span>
            <span className="font-bold text-neutral-200 text-sm">DPSBus</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400">School Social Media App</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" aria-label="Footer links">
            <Link href="/" className="hover:text-neutral-200 transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-neutral-200 transition-colors">
              About
            </Link>
            <Link href="/safety" className="hover:text-neutral-200 transition-colors">
              Safety &amp; Cyber Rules
            </Link>
            <Link href="/privacy" className="hover:text-neutral-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-200 transition-colors">
              Terms of Use
            </Link>
            <Link href="/contact" className="hover:text-neutral-200 transition-colors">
              Contact
            </Link>
            <Link href="/download" className="hover:text-neutral-200 transition-colors">
              Download App
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-400 text-xs">
          <p>© {year} DPSBus. The official school social media app for Dilsukhnagar Public School students, Hyderabad.</p>
          <p>Private &amp; moderated space for classes 6–10.</p>
        </div>
      </div>
    </footer>
  );
}
