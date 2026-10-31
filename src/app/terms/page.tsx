import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Plain language terms of use for DPS Buzz student community. Explaining community expectations.',
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Use | DPS Buzz Community',
    description:
      'Community terms of use and guidelines for students on DPS Buzz.',
    url: `${baseUrl}/terms`,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz Terms of Use',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use | DPS Buzz',
    description: 'Community guidelines and platform terms for DPS students.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold">
            <span>📋</span> Draft Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Use
          </h1>
          <p className="text-neutral-400 text-xs italic">
            *This document is prepared in clear, non-legalese terms for students and parents, and is subject to official review by school administration.*
          </p>
        </div>

        <section className="space-y-6">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">1. Eligibility</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              DPS Buzz is created solely for active students in classes 6, 7, 8, 9, and 10. You agree to provide accurate information (such as your genuine admission number) during sign up.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">2. Community Standards &amp; Account Suspension</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Every member is expected to behave politely and responsibly. The platform reserves the right to suspend or permanently terminate any account that violates our{' '}
              <Link href="/safety" className="text-pink-400 hover:underline">
                Safety Guidelines
              </Link>, including engaging in bullying, posting offensive material, impersonating teachers or classmates, or attempting to compromise platform security.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">3. Content Ownership &amp; Respect</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              You own the original posts and photos you upload. By posting on DPS Buzz, you grant the platform permission to display that content to your school peers in the app feed. You agree not to upload content that belongs to someone else without their permission.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">4. School Oversight &amp; Cooperation</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              DPS Buzz is a student community dedicated to supporting the school environment. Platform moderators will cooperate with school authorities whenever necessary to ensure student well-being and resolve any disciplinary or cyber-safety issues.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
