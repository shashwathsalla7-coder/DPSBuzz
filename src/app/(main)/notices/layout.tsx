import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Notices',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
