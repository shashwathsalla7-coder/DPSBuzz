import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        // Enforce noindex, nofollow, noarchive on all private student and admin routes
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
