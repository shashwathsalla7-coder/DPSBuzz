import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'DPS Buzz — School Social Media App',
  description:
    'DPS Buzz is the official school social media app for classes 6 to 10. Connect with classmates, share achievements, and stay updated.',
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'DPS Buzz — School Social Media App',
    description:
      'DPS Buzz is the official school social media app for classes 6 to 10. Connect with classmates and download the app.',
    url: baseUrl,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz — School Social Media App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPS Buzz — School Social Media App',
    description: 'DPS Buzz is the official school social media app for classes 6-10.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between selection:bg-cyan-600 selection:text-white">
      {/* Client-side check: seamlessly transition logged-in students to /home */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var stored = localStorage.getItem('dpsbuzz_user');
              if (stored) {
                var u = JSON.parse(stored);
                if (u && u.username && u.username.toLowerCase() !== 'guest') {
                  if (u.username.toLowerCase() === 'shashwath71845') {
                    if (localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true') {
                      window.location.replace('/home');
                    }
                  } else {
                    window.location.replace('/home');
                  }
                }
              }
            } catch (e) {}
          `,
        }}
      />

      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-[var(--primary)] text-xs font-semibold">
            <span>🐝</span>
            <span>Official School Social Media App • Classes 6 to 10</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] max-w-2xl mx-auto leading-[1.05] text-[var(--text)]"
            style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
          >
            Your class, your school, one app.
          </h1>

          {/* Semantic direct answer for AI crawlers & entity summarization */}
          <p className="text-[var(--text)] text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            <strong className="text-[var(--text)] font-semibold">DPS Buzz</strong> is the school social media app for DPS students in classes 6 to 10. Follow classmates, share posts and reels, keep a study streak, and read school notices in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent-cta)] via-[var(--accent-cta)] to-[var(--accent-cta)] text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-cyan-600/20 transition-all text-center"
            >
              Join Community ✨
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] font-semibold text-sm hover:bg-neutral-850 hover:text-white transition-colors text-center"
            >
              Log In to Portal
            </Link>
            <Link
              href="/download"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)] font-medium text-sm hover:text-[var(--text)] transition-colors text-center"
            >
              📱 Download App
            </Link>
          </div>
        </div>

        {/* Featured Video / Ad Spotlight */}
        <section className="rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Featured Spotlight
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-[var(--primary)] border border-purple-500/30">
              Official Ad
            </span>
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg)] flex items-center justify-center">
            <video
              src="/videos/ad.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[var(--text-muted)]">
              Official video spotlight for students.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--accent-cta)] to-[var(--accent-cta)] text-white hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
            >
              Get Started ✨
            </Link>
          </div>
        </section>

        {/* Who Can Join Section */}
        <section className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎓</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Who Can Join DPS Buzz?
            </h2>
          </div>
          <p className="text-[var(--text)] text-sm sm:text-base leading-relaxed">
            DPS Buzz is exclusively reserved for current students of <strong>classes 6, 7, 8, 9, and 10</strong>.
          </p>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
            To prevent spam and protect our students, registration requires a valid school admission number and the secret class invite code. Accounts are cross-verified before full access is unlocked.
          </p>
        </section>

        {/* How to Join Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Simple 3-Step Onboarding
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How to Join in 2 Minutes
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[var(--primary)] font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-semibold text-white text-base">Get Your Invite Code</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Obtain your class invite code from your class group or peer representatives.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[var(--primary)] font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-semibold text-white text-base">Verify Admission No.</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Enter your student admission number and choose your unique school username.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-semibold text-white text-base">Connect &amp; Collaborate</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Access your class group, celebrate achievements on Star Board, and share moments.
              </p>
            </div>
          </div>
        </section>

        {/* Safety & Privacy Features */}
        <section className="rounded-2xl bg-gradient-to-b from-neutral-900/60 to-[var(--bg)] border border-[var(--line)] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Safe Space Guarantee
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Built Specifically for Student Privacy
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Unlike public commercial apps, DPS Buzz does not monetize student data or expose children to strangers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
              <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <span>🛡️</span> Zero Tolerance for Bullying
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Instant reporting system with active student and staff moderation. Harassment results in swift account suspension.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
              <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <span>🚫</span> Blocked from Search Engines
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Student names, photos, class sections, and feeds are kept behind login and blocked from Google search results.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/privacy" className="text-[var(--text)] hover:text-white underline">
              Read our Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/safety" className="text-[var(--text)] hover:text-white underline">
              Community Guidelines
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-[var(--text)] hover:text-white underline">
              Terms of Use
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
