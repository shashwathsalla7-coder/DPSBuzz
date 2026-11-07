import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
    ],
  },
  async headers() {
    return [
      {
        // Global CERT-In & OWASP Security Headers applied to every route
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://upload.wikimedia.org https://commons.wikimedia.org https://images.unsplash.com https://media.tenor.com https://c.tenor.com https://*.giphy.com https://*.cloudflarestorage.com https://media.dpsbuzz.in https://*.supabase.co; media-src 'self' blob: data: https://res.cloudinary.com https://*.cloudflarestorage.com https://media.dpsbuzz.in; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://*.cloudflarestorage.com https://*.cloudflare.com https://*.zegocloud.com https://*.zego.im wss://*.zegocloud.com wss://*.zego.im; frame-src 'self' https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self';",
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        // Enforce noindex, nofollow, noarchive on all private student and admin routes (DPDPA Student Privacy)
        source: '/:path(api|admin|home|u|chats|groups|notices|leaderboard|search|settings|post|cricket|game|games|preview|styleguide)/:rest*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
      {
        // Also catch root private paths without trailing subpaths
        source: '/:path(admin|home|chats|groups|notices|leaderboard|search|settings|cricket|game|games|preview|styleguide)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/rules',
        destination: '/safety',
        permanent: false,
      },
      {
        source: '/game',
        destination: '/chats?view=games',
        permanent: false,
      },
      {
        source: '/games',
        destination: '/chats?view=games',
        permanent: false,
      },
      {
        source: '/cricket',
        destination: '/chats?view=games',
        permanent: false,
      },
      {
        source: '/requests',
        destination: '/chats?view=requests',
        permanent: false,
      },
      {
        source: '/game-requests',
        destination: '/chats?view=requests',
        permanent: false,
      },
      {
        source: '/game/requests',
        destination: '/chats?view=requests',
        permanent: false,
      },
      {
        source: '/games/requests',
        destination: '/chats?view=requests',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
