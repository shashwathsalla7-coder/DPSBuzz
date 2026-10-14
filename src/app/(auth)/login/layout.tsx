import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | Student & Staff Portal',
  description:
    'Log in to DPS Buzz to see what your friends and classmates are up to at Dilsukhnagar Public School.',
  alternates: {
    canonical: 'https://dps-buzz.vercel.app/login',
  },
  openGraph: {
    title: 'Log In to DPS Buzz | Dilsukhnagar Public School',
    description: 'Log in to connect with classmates, see school moments, and participate in DPS Buzz.',
    url: 'https://dps-buzz.vercel.app/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
