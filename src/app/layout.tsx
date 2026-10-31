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
import { getBaseUrl } from '@/lib/site-url';

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DPSBus — School Social Media App',
    template: '%s | DPSBus',
  },
  description:
    'DPSBus is the official school social media app and student community for classes 6 to 10. Connect with classmates, share academic achievements, and stay updated.',
  applicationName: 'DPSBus',
  authors: [{ name: 'DPSBus Community', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'DPSBus',
    'DPS Bus',
    'DPSBus app',
    'DPS Buzz',
    'school social media app',
    'DPS Hyderabad',
    'DPSBus APK download',
    'DPS student community',
    'DPS student social app',
  ],
  creator: 'Shashwath • DPSBus Admin',
  publisher: 'DPSBus Student Community',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
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
    url: siteUrl,
    siteName: 'DPSBus',
    title: 'DPSBus — School Social Media App',
    description:
      'DPSBus is the official school social media app and student community. Connect with classmates, view announcements, and download the app.',
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'DPSBus — School Social Media App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPSBus — School Social Media App',
    description:
      'DPSBus is the official school social media app for students. Connect with classmates and download the app.',
    images: [`${siteUrl}/opengraph-image`],
    creator: '@dpsbus',
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
    title: 'DPSBus',
  },
  verification: {
    google: '6qEUA72oc0FtLXS-QeBPATmv_1rQvgyDBL9UjzGCxoA',
    other: {
      'msvalidate.01': '13BBD0CAA1B0B8745F636F9391DBBD86',
    },
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
      lang="en-IN"
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
        <meta name="msvalidate.01" content="13BBD0CAA1B0B8745F636F9391DBBD86" />
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
