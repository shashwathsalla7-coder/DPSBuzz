import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download DPS Buzz APK (v1.4) | Official Android App',
  description:
    'Download the official DPS Buzz Android APK v1.4. Connect with Dilsukhnagar Public School classmates, share photos, stories, and view school notices.',
  alternates: {
    canonical: 'https://dps-buzz.vercel.app/download',
  },
  openGraph: {
    title: 'Download DPS Buzz APK (v1.4) — Official Android App',
    description:
      'Official Android package (APK) for Dilsukhnagar Public School. Instant 1-tap download, 24/7 cloud server connected.',
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
    title: 'Download DPS Buzz APK (v1.4)',
    description: 'Download the official Android APK for Dilsukhnagar Public School.',
    images: ['/icons/icon-512.png'],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
