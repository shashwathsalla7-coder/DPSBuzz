import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Notices & Circulars',
  description:
    'Official circulars, exam timetables, event schedules, and administrative announcements for Dilsukhnagar Public School.',
  alternates: {
    canonical: 'https://dps-buzz.vercel.app/notices',
  },
  openGraph: {
    title: 'School Notices & Circulars | DPS Buzz',
    description: 'Stay updated with official academic dispatches and timetables from Dilsukhnagar Public School.',
    url: 'https://dps-buzz.vercel.app/notices',
  },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
