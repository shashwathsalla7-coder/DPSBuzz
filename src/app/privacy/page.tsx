import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Plain language privacy policy for DPS Buzz student community. Explaining student data protection.',
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | DPS Buzz Community',
    description:
      'Student privacy protection and plain-language data policy on DPS Buzz.',
    url: `${baseUrl}/privacy`,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz Privacy Policy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | DPS Buzz',
    description: 'Student data protection policy for the DPS Buzz community.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold">
            <span>ℹ️</span> Notice for School &amp; Parents
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-neutral-400 text-xs italic">
            *This policy is drafted in plain language for students, parents, and school administration.*
          </p>
          <p className="text-neutral-300 text-base leading-relaxed">
            DPS Buzz is designed from the ground up to protect children&apos;s privacy. We do not sell data, we do not show commercial advertisements, and we do not track students across third-party websites.
          </p>
        </div>

        <section className="space-y-6">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">1. What Information We Collect</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              When a student creates an account, we collect only the minimum information needed to verify enrollment and keep the community secure:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1.5 pl-2">
              <li><strong>Student Details:</strong> Name, class (6–10), section, and school admission number.</li>
              <li><strong>Account Credentials:</strong> Username and an encrypted password.</li>
              <li><strong>Content You Create:</strong> Posts, photos, comments, and direct messages that you choose to share with classmates.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">2. Where Data Is Stored &amp; Protected</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              All student data is securely stored in Supabase with row-level security (RLS) policies enabled. User passwords are encrypted using industry-standard hashing and can never be viewed by administrators in plaintext.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">3. Who Can See Your Profile &amp; Posts</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              <strong>Only verified, logged-in students and designated moderators can view the feed, stories, or profiles.</strong>
            </p>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Public search engines (such as Google, Bing, and Yahoo) and automated web scrapers are strictly blocked via robots.txt, <code>noindex</code> meta tags, and <code>X-Robots-Tag</code> HTTP response headers. Your profile and photos will never show up in public search results.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">4. Account Deletion &amp; Data Rights (DPDPA Section 12)</h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Students and parents have the right to request deletion of an account at any time. Inside the app, navigate to <strong>Settings → Delete My Account</strong>, or contact our support team at <Link href="/contact" className="text-blue-400 hover:underline">our Contact page</Link> to permanently erase your profile, photos, and messages from the database.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-blue-900/50 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🇮🇳</span> 5. DPDPA 2023 &amp; CERT-In Compliance Statement
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              DPS Buzz operates in full compliance with the Digital Personal Data Protection Act, 2023 and CERT-In directions:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1.5 pl-2">
              <li><strong>Zero Behavioral Profiling:</strong> We strictly refrain from tracking, profiling, or monetizing any child&apos;s online activity.</li>
              <li><strong>Zero Dark Patterns:</strong> We comply with the Central Consumer Protection Authority (CCPA) Dark Patterns Guidelines 2023, with no deceptive UI tricks or forced opt-ins.</li>
              <li><strong>72-Hour Breach Notification:</strong> In the unlikely event of any personal data breach, affected users and the Data Protection Board of India (DPBI) will be notified within 72 hours.</li>
              <li><strong>Grievance Redressal:</strong> Grievance complaints are acknowledged within 24 hours at <a href="mailto:grievance@dpsbuzz.org" className="text-blue-400 hover:underline">grievance@dpsbuzz.org</a>.</li>
            </ul>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
