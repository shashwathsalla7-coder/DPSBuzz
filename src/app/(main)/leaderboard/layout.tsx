import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Star Board & Honors',
  description:
    'Top students, spirit points leaderboard, and active habit streaks at Dilsukhnagar Public School.',
  alternates: {
    canonical: 'https://dpsbuzz.netlify.app/leaderboard',
  },
  openGraph: {
    title: 'Star Board & Honors | DPS Buzz',
    description: 'Celebrating high-achieving students and habit streaks at Dilsukhnagar Public School.',
    url: 'https://dpsbuzz.netlify.app/leaderboard',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
