'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, X, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [, setInstalledSuccess] = useState(false);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if running inside the native Android APK or installed standalone PWA
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isNativeApp =
      userAgent.includes('dpsbuzz') ||
      Boolean((window as unknown as { AndroidBridge?: unknown }).AndroidBridge);

    if (isStandaloneMode || isNativeApp) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed in localStorage or sessionStorage
    const dismissed =
      localStorage.getItem('dpsbuzz_install_dismissed') ||
      sessionStorage.getItem('dpsbuzz_install_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Only suggest installing to students who keep coming back (3rd visit onward).
    try {
      if (!sessionStorage.getItem('dpsbuzz_visit_counted')) {
        sessionStorage.setItem('dpsbuzz_visit_counted', '1');
        const visits = Number(localStorage.getItem('dpsbuzz_visit_count') || '0') + 1;
        localStorage.setItem('dpsbuzz_visit_count', String(visits));
      }
      setIsReturningVisitor(Number(localStorage.getItem('dpsbuzz_visit_count') || '0') >= 3);
    } catch {}

    // Detect device type
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    setIsIOS(isAppleDevice);
    setIsDesktop(!isMobileDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      localStorage.setItem('dpsbuzz_install_dismissed', 'true');
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: direct to /download page with proper platform query
      window.location.href = isDesktop ? '/download?platform=desktop' : '/download?platform=android';
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        setDeferredPrompt(null);
        localStorage.setItem('dpsbuzz_install_dismissed', 'true');
      }
    } catch {
      window.location.href = isDesktop ? '/download?platform=desktop' : '/download?platform=android';
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSTip(false);
    localStorage.setItem('dpsbuzz_install_dismissed', 'true');
    sessionStorage.setItem('dpsbuzz_install_dismissed', 'true');
  };

  // Only on Home, only for returning visitors, and never once installed or closed.
  if (isStandalone || isDismissed || !isReturningVisitor || pathname !== '/home') return null;

  return (
    <aside
      aria-label="Install DPS Buzz"
      className="fixed bottom-[76px] md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-[360px] z-40"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
        <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] leading-tight">Get the DPS Buzz app</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
            {isDesktop ? 'Opens in its own window.' : 'Opens full screen from your home screen.'}
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[var(--accent-cta)] text-[var(--on-accent-cta)] text-sm font-semibold hover:bg-[var(--accent-cta-hover)] transition-colors cursor-pointer"
        >
          <Download size={15} aria-hidden />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {showIOSTip && (
        <div className="mt-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
          <p className="font-semibold flex items-center gap-1.5">
            <Share2 size={14} aria-hidden /> On iPhone or iPad
          </p>
          <ol className="list-decimal list-inside mt-1 space-y-0.5 text-[var(--text-muted)]">
            <li>Tap Share in Safari.</li>
            <li>Tap Add to Home Screen.</li>
          </ol>
          <Link href="/download" className="inline-block mt-1.5 text-[var(--primary)] font-medium">More install options</Link>
        </div>
      )}
    </aside>
  );
}
