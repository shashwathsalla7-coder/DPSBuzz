import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
  MobileTabBar,
  DesktopSidebar,
  TopBar,
  GlobalModerationGuard,
  GlobalNotificationListener,
  AuthGuard,
  DataVersionGuard,
} from '@/components/layout';
import { AppleHelloSplash } from '@/components/ui';
import GlobalCallProvider from '@/components/calls/GlobalCallProvider';
import InstallPromptBanner from '@/components/pwa/InstallPromptBanner';

// Protect all logged-in student and private routes from search engine indexing
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DataVersionGuard />
      <div className="min-h-dvh">
        {/* Real-time WebRTC Voice & Video Calling Provider */}
        <Suspense fallback={null}>
          <GlobalCallProvider />
        </Suspense>

        {/* Real-time Global Chat Notification Banners, Audio Chime & Unread Synchronization */}
        <Suspense fallback={null}>
          <GlobalNotificationListener />
        </Suspense>

        {/* Apple-style Hello Welcome Greeting */}
        <AppleHelloSplash />

        {/* Global Moderation & Administrative Guard (Bans, Warnings & Super Admin Quick Access) */}
        <Suspense fallback={null}>
          <GlobalModerationGuard />
        </Suspense>

        {/* Desktop sidebar */}
        <Suspense fallback={null}>
          <DesktopSidebar />
        </Suspense>
        
        {/* Mobile top bar */}
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>

        {/* Main content area - offset for sidebar on desktop */}
        <main className="md:ml-[72px] lg:ml-[240px] pb-[104px] md:pb-6">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <Suspense fallback={null}>
          <MobileTabBar />
        </Suspense>

        {/* PWA 1-Tap Mobile App Install Banner */}
        <InstallPromptBanner />
      </div>
    </AuthGuard>
  );
}
