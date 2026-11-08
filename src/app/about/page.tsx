import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'About DPS Buzz — School Social Media App',
  description:
    'Learn about DPS Buzz, the official school social media app for classes 6 to 10.',
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'About DPS Buzz — School Social Media App',
    description:
      'Learn about DPS Buzz, the official school social media app for classes 6 to 10.',
    url: `${baseUrl}/about`,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'About DPS Buzz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About DPS Buzz — School Social Media App',
    description: 'Learn about DPS Buzz, the official school social media app for students.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-wider uppercase text-[var(--primary)]">
            Official Community Profile
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            About DPS Buzz
          </h1>
          <p className="text-[var(--text)] text-base sm:text-lg leading-relaxed">
            <strong className="text-white font-semibold">DPS Buzz is the official school social media app</strong> created exclusively for students of classes 6 to 10.
          </p>
        </div>

        <section className="space-y-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Our Purpose</h2>
          <p className="text-[var(--text)] text-sm sm:text-base leading-relaxed">
            Our goal is to give students a safe, fun, and constructive environment to stay connected with classmates, share academic achievements, celebrate school sports and science exhibitions, and receive circulars and house event announcements.
          </p>
          <p className="text-[var(--text)] text-sm sm:text-base leading-relaxed">
            Unlike public social networks, DPS Buzz is a closed network. It requires an admission number and school invite code to sign up, ensuring only enrolled students participate.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>🔒</span> Private by Design
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Student profiles, posts, chats, and class sections are completely shielded from public search engines and web crawlers.
            </p>
          </div>

          <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>🤝</span> Friendly &amp; Moderated
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Strict community rules against harassment and bullying. Content reports are reviewed actively by student and staff moderators.
            </p>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-[var(--line)]">
          <h2 className="text-xl font-bold text-white">Who Can Join?</h2>
          <p className="text-[var(--text)] text-sm leading-relaxed">
            Registration is open strictly to verified students of classes 6, 7, 8, 9, and 10. You will need your school ID admission number and your class invite code to activate your account.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-cta)] via-[var(--accent-cta)] to-orange-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Sign Up with Invite Code
            </Link>
            <Link
              href="/safety"
              className="inline-flex items-center px-5 py-2.5 rounded-xl border border-[var(--line)] text-[var(--text)] hover:bg-[var(--surface)] text-sm transition-colors"
            >
              Read Safety Rules
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
