import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  cabinetGrotesk,
  satoshi,
  kalam,
  ibmPlexMono,
  gambetta,
} from './fonts';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  metadataBase: new URL('https://dpsbuzz.netlify.app'),
  title: {
    default: 'DPS Buzz — Official Student Social Network | Dilsukhnagar Public School',
    template: '%s | DPS Buzz',
  },
  description:
    'DPS Buzz is the official student social network for Dilsukhnagar Public School (DPS). Connect with classmates, share school moments, access official school circulars & Star Board, and download the official Android APK v1.4.',
  applicationName: 'DPS Buzz',
  authors: [{ name: 'DPS Buzz Community', url: 'https://dpsbuzz.netlify.app' }],
  generator: 'Next.js',
  keywords: [
    'DPS Buzz',
    'Dilsukhnagar Public School',
    'DPS Dilsukhnagar',
    'DPS Hyderabad',
    'DPS Buzz app',
    'DPS Buzz APK download',
    'Dilsukhnagar school social app',
    'DPS school circulars and notices',
    'DPS Star Board',
    'DPS Buzz official student network',
  ],
  creator: 'Shashwath • DPS Buzz Admin',
  publisher: 'Dilsukhnagar Public School',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://dpsbuzz.netlify.app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dpsbuzz.netlify.app',
    siteName: 'DPS Buzz',
    title: 'DPS Buzz — Official Student Social Network | Dilsukhnagar Public School',
    description:
      'Connect with classmates, share school moments, view circulars & Star Board on DPS Buzz. Download the official Android APK v1.4.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'DPS Buzz — Dilsukhnagar Public School Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPS Buzz — Dilsukhnagar Public School',
    description:
      'The vibrant student social network for Dilsukhnagar Public School. Connect with classmates, track school dispatches, and download the APK.',
    images: ['/icons/icon-512.png'],
    creator: '@dpsbuzz',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DPS Buzz',
  },
  verification: {
    google: '6qEUA72oc0FtLXS-QeBPATmv_1rQvgyDBL9UjzGCxoA',
  },
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#09090b',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cabinetGrotesk.variable} ${satoshi.variable} ${kalam.variable} ${ibmPlexMono.variable} ${gambetta.variable}`}
    >
      <head>
        <JsonLd />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="google-site-verification" content="6qEUA72oc0FtLXS-QeBPATmv_1rQvgyDBL9UjzGCxoA" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const params = new URLSearchParams(window.location.search);
                const themeParam = params.get('theme');
                if (themeParam === 'dark' || themeParam === 'light') {
                  document.documentElement.setAttribute('data-theme', themeParam);
                } else {
                  const storedTheme = localStorage.getItem('dpsbuzz_theme');
                  if (storedTheme) {
                    document.documentElement.setAttribute('data-theme', storedTheme);
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
