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
