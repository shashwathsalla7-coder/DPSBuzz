import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Join Community (Classes 6–10)',
  description:
    'Join DPS Buzz, the student community for classes 6-10. Sign up with your school invite code.',
  alternates: {
    canonical: `${baseUrl}/signup`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Join DPS Buzz | Student Community',
    description: 'Register with your school invite code to join DPS Buzz.',
    url: `${baseUrl}/signup`,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz — Sign Up',
      },
    ],
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
