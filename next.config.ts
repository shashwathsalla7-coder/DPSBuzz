import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  typescript: {
    ignoreBuildErrors: true,
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
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
    ],
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
    ];
  },
};

export default nextConfig;
