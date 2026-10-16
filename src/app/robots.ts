import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://dpsbuzz.netlify.app';

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
