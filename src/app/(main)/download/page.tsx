'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertCircle,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Detect if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) setInstalled(true);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handlePwaInstall = async () => {
    if (isIOS) {
      alert('On iPhone / Safari: Tap the Share button (⬆️) at the bottom, then tap "Add to Home Screen" (+).');
      return;
    }

    if (!deferredPrompt) {
      alert('To install on Android Chrome: Tap the 3 dots (⋮) in the top right, then select "Install app" or "Add to Home screen".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApkDownload = () => {
    setDownloadStarted(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = '/api/download/apk';
    link.download = 'DPS_Buzz.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-xl mx-auto space-y-8 animate-fade-in bg-black text-white">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-block relative">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-900 border-2 border-pink-500/50 p-2 flex items-center justify-center shadow-xl shadow-pink-500/20">
            <img
              src="/icons/icon-192.png"
              alt="DPS Buzz App"
              className="w-full h-full rounded-2xl object-cover"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold gradient-bg text-white shadow-md">
            v1.3 Cloud 24/7
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Get DPS Buzz on your Phone 📱
          </h1>
          <p className="text-xs md:text-sm text-zinc-200 font-medium mt-1.5 max-w-sm mx-auto">
            Private, lightning-fast school social network. Choose your preferred way to install below:
          </p>
        </div>
      </div>

      {/* Primary Option: PWA Home Screen App */}
      <div className="bg-zinc-900 border-2 border-pink-500/60 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 px-3 py-1 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
          Recommended
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Method 1: Instant 1-Tap App</h2>
              <p className="text-xs text-zinc-200 mt-0.5 font-medium">
                Works on Android & iPhone • 0 MB storage • Zero install warnings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-white font-medium">
            <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Full-screen app icon</span>
            </div>
            <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Auto-updates silently</span>
            </div>
            <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Zero Play Store hassle</span>
            </div>
            <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>100% Private & Safe</span>
            </div>
          </div>

          <button
            onClick={handlePwaInstall}
            className="w-full min-h-[46px] rounded-2xl gradient-bg text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-95 transition-all hover:opacity-95 cursor-pointer"
          >
            <Smartphone size={18} />
            <span>{installed ? '✓ App Already Installed!' : isIOS ? 'Add to iPhone Home Screen' : 'Install App to Home Screen'}</span>
          </button>

          {isIOS && (
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Share2 size={14} className="text-blue-400" /> Instructions for Safari (iPhone):
              </p>
              <p className="text-[11px] text-zinc-400">
                1. Tap the <span className="text-white font-semibold">Share button</span> at the bottom of Safari (square with arrow up ⬆️).
              </p>
              <p className="text-[11px] text-zinc-400">
                2. Scroll down and tap <span className="text-white font-semibold">&apos;Add to Home Screen&apos;</span> (+).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Option: Android APK Direct Download */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 md:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Download size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Method 2: Standalone Android APK</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                .apk file
              </span>
            </div>
            <p className="text-xs text-zinc-200 mt-0.5 font-medium">
              Direct package for Android phones • Shareable via WhatsApp or Bluetooth
            </p>
          </div>
        </div>

        {downloadStarted && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-medium">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>Downloading <strong>DPS_Buzz.apk</strong>... Check your notifications or downloads folder.</span>
          </div>
        )}

        <button
          onClick={handleApkDownload}
          className="w-full min-h-[46px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <Download size={18} />
          <span>Download Android APK (`DPS_Buzz.apk`)</span>
        </button>

        {/* 3-Step APK Install Guide */}
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            How to Install the APK on Android (3 Quick Steps):
          </p>

          <div className="space-y-2">
            {[
              {
                step: 1,
                title: 'Download the APK',
                desc: 'Tap the button above. The file "DPS_Buzz.apk" will download to your phone.',
              },
              {
                step: 2,
                title: 'Tap the downloaded file',
                desc: 'Open your notification bar or your phone Files/Downloads app and tap DPS_Buzz.apk.',
              },
              {
                step: 3,
                title: 'Allow from this source (if prompted)',
                desc: 'If Android displays "For your security, your phone is not allowed to install unknown apps", tap Settings -> toggle ON "Allow from this source", then tap Install.',
              },
            ].map((item) => (
              <div
                key={item.step}
                onClick={() => setActiveStep(activeStep === item.step ? null : item.step)}
                className="bg-zinc-950 border border-zinc-750 p-3.5 rounded-xl cursor-pointer hover:border-zinc-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  {activeStep === item.step ? <ChevronUp size={16} className="text-zinc-300" /> : <ChevronDown size={16} className="text-zinc-300" />}
                </div>
                {activeStep === item.step && (
                  <p className="text-xs text-zinc-200 mt-2 pl-7 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strict Privacy & Confidentiality Guarantee Box */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
          <Lock size={15} className="text-amber-400" />
          <span className="text-white">Strict Privacy & Confidentiality</span>
        </div>

        <ul className="text-xs text-zinc-200 space-y-2.5 leading-relaxed font-medium">
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🤫</span>
            <span><strong className="text-white">Zero Google Play Store Listing:</strong> We deliberately avoid the public Play Store. Google reviewers and school administrators will never find or see this app listed anywhere.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🚫</span>
            <span><strong className="text-white">No Search Engine Indexing:</strong> The app is strictly shielded with <code>noindex</code> headers. Search engines will never index student pages.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🔑</span>
            <span><strong className="text-white">Private School Invite Code:</strong> Accounts can only be created with your valid school admission number and secret invite code.</span>
          </li>
        </ul>
      </div>

      {/* Return to Home */}
      <div className="text-center pt-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
        >
          <span>Go to DPS Buzz Web Feed</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
