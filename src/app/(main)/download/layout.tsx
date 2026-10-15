import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Install DPS Buzz | Laptop, Android APK (v1.4) & iPhone App',
  description:
    'Install or download the official DPS Buzz app for Laptop/PC (Windows, Mac), Android (APK v1.4 & PWA), and iPhone.',
  alternates: {
    canonical: 'https://dps-buzz.vercel.app/download',
  },
  openGraph: {
    title: 'Install DPS Buzz — Laptop, Android APK (v1.4) & iPhone App',
    description:
      'Official school social app for Dilsukhnagar Public School. Standalone desktop app, Android APK v1.4, and iOS Safari app.',
    url: 'https://dps-buzz.vercel.app/download',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'DPS Buzz App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Install DPS Buzz (v1.4)',
    description: 'Install DPS Buzz on Laptop, Android, and iPhone.',
    images: ['/icons/icon-512.png'],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
