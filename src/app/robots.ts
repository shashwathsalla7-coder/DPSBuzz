import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://dpsbuzz.netlify.app';
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/download',
          '/login',
          '/signup',
          '/notices',
          '/leaderboard',
          '/groups',
          '/u/*',
        ],
        disallow: [
          '/api/*',
          '/admin',
          '/admin/*',
          '/settings',
          '/post/*',
          '/chats/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
