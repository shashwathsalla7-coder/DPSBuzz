import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Class Sections & Clubs',
  description:
    'Join your official class section group, hobby clubs, and sports teams at Dilsukhnagar Public School.',
  alternates: {
    canonical: 'https://dps-buzz.vercel.app/groups',
  },
  openGraph: {
    title: 'Class Sections & Clubs | DPS Buzz',
    description: 'Connect with your classmates in dedicated section and club spaces.',
    url: 'https://dps-buzz.vercel.app/groups',
  },
};

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
