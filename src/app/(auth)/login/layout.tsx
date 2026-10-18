import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Student & Staff Login',
  description:
    'Log in to DPS Buzz, the student community for Dilsukhnagar Public School students in Hyderabad. Connect with classmates and access school updates.',
  alternates: {
    canonical: `${baseUrl}/login`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Log In to DPS Buzz | Dilsukhnagar Public School',
    description: 'Log in to connect with classmates and school updates on DPS Buzz.',
    url: `${baseUrl}/login`,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz — Log In',
      },
    ],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
