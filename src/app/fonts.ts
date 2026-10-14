import localFont from 'next/font/local';

/**
 * Cabinet Grotesk (Fontshare)
 * Display font: wordmark, screen titles, notice titles, Star Board rank numerals.
 * Loaded via next/font/local, Latin glyphs only, font-display: swap.
 */
export const cabinetGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/CabinetGrotesk-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Extrabold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-cabinet',
  display: 'swap',
});

/**
 * Satoshi (Fontshare)
 * Body and UI font: buttons, tabs, chips, captions, comments, chat, forms.
 * Variable font file: covers weights 300 to 900 (400, 500, 600, 700).
 * Loaded via next/font/local, Latin glyphs only, font-display: swap.
 */
export const satoshi = localFont({
  src: '../../public/fonts/Satoshi-Variable.woff2',
  variable: '--font-satoshi',
  display: 'swap',
  weight: '300 900',
});

/**
 * Kalam (Google Fonts, self-hosted locally)
 * Handwritten accent: tiny notebook margin notes, Star of the Week annotation.
 * Strictly maximum one use per screen.
 */
export const kalam = localFont({
  src: '../../public/fonts/Kalam-Regular.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-kalam',
  display: 'swap',
});

/**
 * IBM Plex Mono (Google Fonts, self-hosted locally)
 * Monospace & Tabular fallback for admission numbers and leaderboard counters.
 */
export const ibmPlexMono = localFont({
  src: [
    {
      path: '../../public/fonts/IBMPlexMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/IBMPlexMono-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-ibm-mono',
  display: 'swap',
});

/**
 * Gambetta (Fontshare, self-hosted locally)
 * Optional serif display font for notice titles (only if approved).
 */
export const gambetta = localFont({
  src: '../../public/fonts/Gambetta-Bold.woff2',
  weight: '700',
  style: 'normal',
  variable: '--font-gambetta',
  display: 'swap',
});
