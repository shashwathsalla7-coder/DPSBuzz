import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'DPSBus — School Social Media App',
  description:
    'DPSBus is the official school social media app for classes 6 to 10. Connect with classmates, share achievements, and stay updated.',
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'DPSBus — School Social Media App',
    description:
      'DPSBus is the official school social media app for classes 6 to 10. Connect with classmates and download the app.',
    url: baseUrl,
    siteName: 'DPSBus',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPSBus — School Social Media App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPSBus — School Social Media App',
    description: 'DPSBus is the official school social media app for classes 6-10.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-cyan-600 selection:text-white">
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <span>🐝</span>
            <span>Official School Social Media App • Classes 6 to 10</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight sm:leading-none text-white">
            DPSBus —{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              School Social Media App
            </span>
          </h1>

          {/* Semantic direct answer for AI crawlers & entity summarization */}
          <p className="text-neutral-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            <strong className="text-white font-semibold">DPSBus is the official school social media app</strong> created exclusively for students of classes 6 to 10. It is a positive, safe, and moderated student community platform where verified classmates connect, share academic achievements, track daily study habits, and view official school announcements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-500 text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-cyan-600/20 transition-all text-center"
            >
              Join Community ✨
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-sm hover:bg-neutral-850 hover:text-white transition-colors text-center"
            >
              Log In to Portal
            </Link>
            <Link
              href="/download"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-400 font-medium text-sm hover:text-neutral-200 transition-colors text-center"
            >
              📱 Download App
            </Link>
          </div>
        </div>

        {/* Featured Video / Ad Spotlight */}
        <section className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Featured Spotlight
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Official Ad
            </span>
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              src="/videos/ad.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-neutral-400">
              Official video spotlight for students.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
            >
              Get Started ✨
            </Link>
          </div>
        </section>

        {/* Who Can Join Section */}
        <section className="rounded-2xl bg-neutral-900/40 border border-neutral-850 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎓</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Who Can Join DPS Buzz?
            </h2>
          </div>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            DPS Buzz is exclusively reserved for current students of <strong>classes 6, 7, 8, 9, and 10</strong>.
          </p>
          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
            To prevent spam and protect our students, registration requires a valid school admission number and the secret class invite code. Accounts are cross-verified before full access is unlocked.
          </p>
        </section>

        {/* How to Join Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
              Simple 3-Step Onboarding
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How to Join in 2 Minutes
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-neutral-900/50 border border-neutral-850 p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-semibold text-white text-base">Get Your Invite Code</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Obtain your class invite code from your class group or peer representatives.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-900/50 border border-neutral-850 p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-semibold text-white text-base">Verify Admission No.</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter your student admission number and choose your unique school username.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-900/50 border border-neutral-850 p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-semibold text-white text-base">Connect &amp; Collaborate</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Access your class group, celebrate achievements on Star Board, and share moments.
              </p>
            </div>
          </div>
        </section>

        {/* Safety & Privacy Features */}
        <section className="rounded-2xl bg-gradient-to-b from-neutral-900/60 to-neutral-950 border border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Safe Space Guarantee
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Built Specifically for Student Privacy
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Unlike public commercial apps, DPS Buzz does not monetize student data or expose children to strangers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl bg-neutral-950/60 border border-neutral-850">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <span>🛡️</span> Zero Tolerance for Bullying
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Instant reporting system with active student and staff moderation. Harassment results in swift account suspension.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-neutral-950/60 border border-neutral-850">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <span>🚫</span> Blocked from Search Engines
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Student names, photos, class sections, and feeds are kept behind login and blocked from Google search results.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-neutral-400">
            <Link href="/privacy" className="text-neutral-300 hover:text-white underline">
              Read our Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/safety" className="text-neutral-300 hover:text-white underline">
              Community Guidelines
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-neutral-300 hover:text-white underline">
              Terms of Use
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
