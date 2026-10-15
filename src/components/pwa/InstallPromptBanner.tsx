'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Laptop, Smartphone, X, Check, Share2, Sparkles } from 'lucide-react';

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
  const [installedSuccess, setInstalledSuccess] = useState(false);

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

  // If already installed or dismissed, NEVER block the screen or Profile tab
  if (isStandalone || isDismissed) return null;

  return (
    <aside
      aria-label="Install DPS Buzz App"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-50 animate-fade-in"
    >
      <div className="relative bg-zinc-950/95 border border-zinc-800 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl shadow-black/80">
        {/* Glow accent */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

        <div className="flex items-start gap-3">
          {/* App icon preview */}
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700/60 p-1 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/icons/icon-192.png"
              alt="DPS Buzz App"
              className="w-full h-full rounded-lg object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide">
                {isDesktop ? 'Install on Laptop / PC' : 'Install DPS Buzz App'}
              </h2>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/15 text-pink-400">
                <Sparkles size={9} /> FREE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              {isDesktop
                ? 'Run DPS Buzz in a standalone desktop window. Pin to your Windows Taskbar.'
                : 'Instant 1-tap app for your phone. Full-screen, faster, zero Play Store hassle.'}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close install prompt"
          >
            <X size={15} />
          </button>
        </div>

        {/* iOS specific instruction popover */}
        {showIOSTip && (
          <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-[11px] text-zinc-300 space-y-1.5 animate-scale-in">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Share2 size={13} className="text-blue-400" /> On iPhone / iPad:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300">
              <li>Tap the <span className="font-semibold text-white">Share button (⬆️)</span> in Safari</li>
              <li>Scroll down and tap <span className="font-semibold text-white">&apos;Add to Home Screen&apos; (+)</span></li>
            </ol>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 min-h-[38px] rounded-xl gradient-bg text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95 transition-all hover:opacity-95 cursor-pointer"
          >
            {isDesktop ? <Laptop size={14} /> : <Download size={14} />}
            <span>
              {isDesktop
                ? 'Install on PC'
                : isIOS
                ? 'How to Install on iPhone'
                : 'Install to Home Screen'}
            </span>
          </button>

          <Link
            href={isDesktop ? '/download?platform=desktop' : '/download?platform=android'}
            className="px-3 min-h-[38px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            {isDesktop ? 'Guide' : 'APK Options'}
          </Link>
        </div>
      </div>
    </aside>
  );
}
