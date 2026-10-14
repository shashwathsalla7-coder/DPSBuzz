import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

export function generateStaticParams() {
  return [
    { username: 'shashwath71845' },
    { username: 'admin' },
  ];
}

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
