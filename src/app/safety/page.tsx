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

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold">
            <span>🛡️</span> Indian Cyber Laws (DPDPA 2023 &amp; CERT-In) &amp; Global Safety Standards
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Safety, Security &amp; Legal Compliance Rules
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            DPS Buzz adheres strictly to India&apos;s latest digital safety regulations, including the <strong>Digital Personal Data Protection Act (DPDPA 2023)</strong>, <strong>CERT-In Cyber Security Directions</strong>, the <strong>Information Technology Rules (2021/2023)</strong>, and global child-safety frameworks (COPPA and the Age Appropriate Design Code).
          </p>
        </div>

        <section className="space-y-6">
          {/* SECTION 1: DPDPA 2023 Children's Data Protection */}
          <div className="rounded-2xl bg-neutral-900/60 border border-blue-900/50 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇮🇳</span>
              <h2 className="text-xl font-bold text-white">
                1. India&apos;s DPDPA 2023 (Section 9: Child Protection Mandate)
              </h2>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Because DPS Buzz is dedicated to school students under 18 years of age (Classes 6–10), we enforce strict compliance with Section 9 of the Digital Personal Data Protection Act:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <p className="text-xs font-bold text-blue-400">🚫 Zero Behavioral Tracking or Profiling</p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  We never track students&apos; browsing habits, search behavior, or device telemetry for commercial or behavioral profiling.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <p className="text-xs font-bold text-blue-400">🚫 Zero Commercial Targeted Advertisements</p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  DPS Buzz contains zero third-party advertisement networks, zero advertising trackers, and zero promotional algorithms.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <p className="text-xs font-bold text-emerald-400">🌱 No Detrimental Processing</p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  We strictly prohibit any algorithm, feed mechanic, or notification schedule that could cause physical, psychological, or emotional harm to students.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <p className="text-xs font-bold text-emerald-400">🗑️ Right to Erasure (Forgotten)</p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Students and parents can permanently erase their account, messages, and uploaded photos at any time with a single tap in Settings.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: CERT-In Cyber Security Compliance */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔐</span>
              <h2 className="text-xl font-bold text-white">
                2. CERT-In Cyber Security Directions (Section 70B, IT Act)
              </h2>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              In accordance with directives issued by the Indian Computer Emergency Response Team (CERT-In), DPS Buzz implements state-of-the-art security controls:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2 pl-2">
              <li>
                <strong>NTP Clock Synchronization:</strong> All server instances, logging mechanisms, and message delivery clocks are synchronized with Indian Standard Time (IST, UTC+05:30) via official Indian time servers (NPL/NIC).
              </li>
              <li>
                <strong>Encrypted Communications:</strong> All application traffic uses TLS 1.3/HTTPS with 256-bit encryption. Plaintext transmission of credentials, messages, or media is blocked at the gateway.
              </li>
              <li>
                <strong>Secure Log Maintenance:</strong> Application security and access logs are retained securely within Indian jurisdiction for the mandatory 180-day compliance rolling period.
              </li>
              <li>
                <strong>6-Hour Incident Notification Rule:</strong> In the event of any security anomaly, breach, or unauthorized access attempt, our platform engineering protocol requires reporting to CERT-In (incident@cert-in.org.in) within 6 hours.
              </li>
            </ul>
          </div>

          {/* SECTION 3: IT Rules 2021/2023 & Resident Grievance Officer */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚖️</span>
              <h2 className="text-xl font-bold text-white">
                3. IT Rules (Intermediary Guidelines) &amp; Grievance Redressal
              </h2>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, DPS Buzz maintains a swift grievance redressal process for students, parents, and teachers:
            </p>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-white">Grievance &amp; Child Safety Officer</p>
                  <p className="text-xs text-neutral-400">DPS Buzz Administration • Dilsukhnagar, Hyderabad, Telangana</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                  Response within 24 Hours
                </div>
              </div>
              <p className="text-xs text-neutral-300 pt-1">
                <strong>Email:</strong> <a href="mailto:grievance@dpsbuzz.org" className="text-blue-400 hover:underline">grievance@dpsbuzz.org</a> (or contact school administration directly).
              </p>
              <ul className="list-disc list-inside text-xs text-neutral-400 space-y-1 pl-1">
                <li>Every safety or privacy grievance is acknowledged within <strong>24 hours</strong>.</li>
                <li>Full resolution and disciplinary action are completed within <strong>15 days</strong>.</li>
                <li><strong>Expedited 24-Hour Takedown:</strong> Any report involving unauthorized personal photos, bodily privacy violations, or severe cyberbullying is reviewed and removed within 24 hours.</li>
              </ul>
            </div>
          </div>

          {/* SECTION 4: Zero Tolerance Prohibited Content (IT Rule 3(1)(b)) */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🛑</span> 4. Prohibited Content (Strictly Forbidden)
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Users must not host, display, upload, modify, publish, transmit, or share any content that:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1.5 pl-2">
              <li>Is harmful, harassing, blasphemous, defamatory, obscene, or invasive of another&apos;s bodily privacy.</li>
              <li>Constitutes cyberbullying, teasing, trolling, exclusion, or intimidation of any classmate.</li>
              <li>Harms minors in any way or exploits underage students.</li>
              <li>Impersonates any classmate, teacher, school staff member, or authority.</li>
              <li>Involves academic dishonesty, including circulating live examination papers, cheat sheets, or unauthorized test answers.</li>
              <li>Threatens the unity, integrity, defense, security, or sovereignty of India.</li>
            </ul>
          </div>

          {/* SECTION 5: Helplines & Immediate Assistance */}
          <div className="rounded-2xl bg-neutral-900/60 border border-blue-900/40 p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📞</span> 5. Emergency Helplines &amp; Support
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              If you or a friend ever feels unsafe, distressed, or experiences cyber harassment, help is always free and confidential:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-xs font-bold text-blue-400">CHILDLINE India</p>
                <p className="text-lg font-extrabold text-white">Dial 1098</p>
                <p className="text-[11px] text-neutral-400">Toll-free 24/7 child safety, emotional support and distress helpline.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-xs font-bold text-blue-400">National Cyber Crime Helpline</p>
                <p className="text-lg font-extrabold text-white">Dial 1930 / cybercrime.gov.in</p>
                <p className="text-[11px] text-neutral-400">Government of India cyber safety and fraud reporting portal.</p>
              </div>
            </div>
            <p className="text-neutral-400 text-xs pt-2">
              You can also contact school authorities or use the in-app <strong>Report Content</strong> feature on any post, comment, or message.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
