import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Safety & Community Guidelines',
  description:
    'Community guidelines, anti-bullying rules, and safety reporting on DPS Buzz for Dilsukhnagar Public School students in Hyderabad.',
  alternates: {
    canonical: `${baseUrl}/safety`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Safety & Guidelines | DPS Buzz Community',
    description:
      'Community guidelines, anti-bullying rules, and safety reporting on DPS Buzz for Dilsukhnagar Public School students in Hyderabad.',
    url: `${baseUrl}/safety`,
    siteName: 'DPS Buzz',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz Community Safety Guidelines',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety & Guidelines | DPS Buzz',
    description: 'Community guidelines and student safety standards on DPS Buzz.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-wider uppercase text-pink-400">
            Student Well-being &amp; Conduct
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Safety &amp; Community Guidelines
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            DPS Buzz is built on kindness, academic respect, and mutual trust. Every member has the right to a supportive, bully-free environment.
          </p>
        </div>

        <section className="space-y-6">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🛑</span> Zero Tolerance for Cyberbullying
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              We strictly forbid any form of bullying, name-calling, harassment, exclusion, or mean-spirited humor targeting any classmate. Accounts that engage in bullying will be immediately warned, suspended, or permanently expelled from the platform.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🔒</span> Protect Your Personal Information
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Never share private information such as your home address, personal phone numbers, bank details, or passwords in posts or public comments. Keep your passwords confidential.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📸</span> Appropriate Content Only
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Only post photos, drawings, and writings that you have created or have clear permission to share. Inappropriate language, offensive imagery, or academic dishonesty (such as sharing live exam answers) will result in immediate content removal.
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🚩</span> How to Report Content &amp; Get Help
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Every post, comment, and chat message includes a <strong>Report</strong> button. When you report content:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1.5 pl-2">
              <li>The post is flagged immediately for moderation.</li>
              <li>Multiple reports automatically hide the item while moderators review it.</li>
              <li>Your report is completely confidential; the author will never be told who reported them.</li>
            </ul>
            <p className="text-neutral-300 text-sm leading-relaxed pt-2">
              If you feel unsafe or have urgent concerns, you can also reach out directly via our{' '}
              <Link href="/contact" className="text-pink-400 hover:underline">
                Contact &amp; Support page
              </Link>.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
