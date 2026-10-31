import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site-url';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Download DPSBus App & Android APK — School Social Media App',
  description:
    'Download the official DPSBus Android APK (v1.4) or install the school social media web app for students.',
  alternates: {
    canonical: `${baseUrl}/download`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Download DPSBus App',
    description:
      'Download the official DPSBus Android APK v1.4 or install the school social media web app for students.',
    url: `${baseUrl}/download`,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPSBus — App Download',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download DPSBus App',
    description: 'Get the DPSBus school social media app for Android and desktop.',
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
