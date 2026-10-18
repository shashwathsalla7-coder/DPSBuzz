import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/safety',
          '/privacy',
          '/terms',
          '/contact',
          '/login',
          '/signup',
          '/download',
        ],
        disallow: [
          '/api/',
          '/api/*',
          '/admin',
          '/admin/',
          '/admin/*',
          '/home',
          '/home/',
          '/home/*',
          '/u/',
          '/u/*',
          '/chats',
          '/chats/',
          '/chats/*',
          '/groups',
          '/groups/',
          '/groups/*',
          '/notices',
          '/notices/',
          '/notices/*',
          '/leaderboard',
          '/leaderboard/',
          '/leaderboard/*',
          '/search',
          '/search/',
          '/search/*',
          '/settings',
          '/settings/',
          '/settings/*',
          '/post/',
          '/post/*',
          '/cricket',
          '/game',
          '/games',
          '/preview',
          '/styleguide',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
