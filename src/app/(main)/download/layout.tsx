import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Download App & Android APK',
  description:
    'Download the official DPS Buzz Android APK (v1.4) or install the web app for Dilsukhnagar Public School students in Hyderabad.',
  alternates: {
    canonical: `${baseUrl}/download`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Download DPS Buzz App | Dilsukhnagar Public School',
    description:
      'Download the official Android APK v1.4 or install the web app for Dilsukhnagar Public School students.',
    url: `${baseUrl}/download`,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPS Buzz — App Download',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download DPS Buzz App',
    description: 'Get the DPS Buzz app for Android and desktop.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
