import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading profile...</div>}>
      <ProfileClient username={username} />
    </Suspense>
  );
}
