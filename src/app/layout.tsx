import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  cabinetGrotesk,
  satoshi,
  kalam,
  ibmPlexMono,
  gambetta,
} from './fonts';

export const metadata: Metadata = {
  title: 'DPS Buzz — Dilsukhnagar Public School',
  description: 'Private school social website for the students of Dilsukhnagar Public School.',
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DPS Buzz',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
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
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
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
      </body>
    </html>
  );
}
