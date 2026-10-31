import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Contact & Support',
  description:
    'Contact the moderation and support team for DPS Buzz. Get help with login, safety, or account issues.',
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Contact & Support | DPS Buzz Community',
    description:
      'Contact the student support and moderation team for DPS Buzz.',
    url: `${baseUrl}/contact`,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz Contact & Support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact & Support | DPS Buzz',
    description: 'Reach out to the DPS Buzz student support and administration team.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-wider uppercase text-purple-400">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Contact &amp; Support
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Have a question, need help with your account, or want to report an urgent safety concern? Our student admin and moderation team is here to assist.
          </p>
        </div>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-bold text-white">Safety &amp; Moderation</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              For reporting cyberbullying, inappropriate conduct, or urgent safety matters regarding students on the platform.
            </p>
            <div className="pt-2">
              <span className="text-xs font-medium text-neutral-400 block">Support Desk</span>
              <a
                href="mailto:dpsbuzz.help@gmail.com"
                className="text-sm font-semibold text-purple-400 hover:underline"
              >
                dpsbuzz.help@gmail.com
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xl">
              🔑
            </div>
            <h2 className="text-lg font-bold text-white">Account &amp; Login Help</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              If you lost your password, cannot verify your admission number, or have trouble downloading the mobile APK.
            </p>
            <div className="pt-2">
              <span className="text-xs font-medium text-neutral-400 block">Technical Support</span>
              <a
                href="mailto:dpsbuzz.help@gmail.com"
                className="text-sm font-semibold text-pink-400 hover:underline"
              >
                dpsbuzz.help@gmail.com
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🏫</span> Campus Community
          </h2>
          <p className="text-sm text-neutral-300">
            Hyderabad, Telangana, India.
          </p>
          <p className="text-xs text-neutral-500">
            Note: DPS Buzz is an independent student community platform built for and used by students of classes 6 to 10.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
