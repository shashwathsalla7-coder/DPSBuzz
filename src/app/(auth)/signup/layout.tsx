import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Join DPS Buzz',
  description:
    'Create your official student account on DPS Buzz with school code DPS71845. Connect with classmates, share school moments, and join class groups.',
  alternates: {
    canonical: 'https://dpsbuzz.netlify.app/signup',
  },
  openGraph: {
    title: 'Join DPS Buzz | Student Registration',
    description: 'Register with school code DPS71845 and join the Dilsukhnagar Public School student social network.',
    url: 'https://dpsbuzz.netlify.app/signup',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
