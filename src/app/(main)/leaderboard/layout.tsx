import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Star Board & Honors',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
