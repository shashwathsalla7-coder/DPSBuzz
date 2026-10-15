'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
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
  ArrowRight,
  Monitor,
  Check,
  HelpCircle,
  Layers,
  Info
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PlatformTab = 'desktop' | 'android' | 'ios';

function DownloadContent() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get('platform') as PlatformTab | null;

  const [activeTab, setActiveTab] = useState<PlatformTab>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);
  const [detectedOS, setDetectedOS] = useState<'windows' | 'mac' | 'android' | 'ios' | 'other'>('windows');

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const isMacDevice = /macintosh|mac os x/.test(ua);
    const isWindowsDevice = /windows|win32/.test(ua);

    if (isIOSDevice) {
      setDetectedOS('ios');
    } else if (isAndroidDevice) {
      setDetectedOS('android');
    } else if (isMacDevice) {
      setDetectedOS('mac');
    } else if (isWindowsDevice) {
      setDetectedOS('windows');
    } else {
      setDetectedOS('other');
    }

    // Set initial tab from query param or auto-detection
    if (platformParam && ['desktop', 'android', 'ios'].includes(platformParam)) {
      setActiveTab(platformParam);
    } else if (isAndroidDevice) {
      setActiveTab('android');
    } else if (isIOSDevice) {
      setActiveTab('ios');
    } else {
      setActiveTab('desktop');
    }

    // Detect if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      ua.includes('dpsbuzz') ||
      Boolean((window as unknown as { AndroidBridge?: unknown }).AndroidBridge);

    if (isStandalone) setInstalled(true);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [platformParam]);

  const handleInstallClick = async () => {
    if (activeTab === 'ios') {
      alert('On iPhone / Safari: Tap the Share button (⬆️) at the bottom of Safari, then tap "Add to Home Screen" (+).');
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // If deferredPrompt is null, show browser-specific install guidance
    if (activeTab === 'desktop') {
      setShowDesktopHelp(true);
    } else if (activeTab === 'android') {
      setShowAndroidHelp(true);
    }
  };

  const handleApkDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/api/download/apk';
    link.download = 'DPS_Buzz.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto space-y-8 animate-fade-in bg-black text-white">
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
            v1.4 24/7
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Install DPS Buzz App
          </h1>
          <p className="text-xs md:text-sm text-zinc-300 font-medium mt-1.5 max-w-md mx-auto">
            Choose your device below for tailored installation instructions, standalone desktop app, or direct Android APK.
          </p>
        </div>
      </div>

      {/* Already Installed Banner */}
      {installed && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-emerald-200">DPS Buzz is already installed!</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              You are running DPS Buzz in standalone mode with instant cloud sync.
            </p>
          </div>
        </div>
      )}

      {/* Platform Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('desktop')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'desktop'
              ? 'gradient-bg text-white shadow-md shadow-pink-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Laptop size={16} />
          <span className="truncate">Laptop / PC</span>
        </button>

        <button
          onClick={() => setActiveTab('android')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'android'
              ? 'gradient-bg text-white shadow-md shadow-pink-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Smartphone size={16} />
          <span className="truncate">Android</span>
        </button>

        <button
          onClick={() => setActiveTab('ios')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ios'
              ? 'gradient-bg text-white shadow-md shadow-pink-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Apple size={16} />
          <span className="truncate">iPhone / iPad</span>
        </button>
      </div>

      {/* TAB 1: LAPTOP / DESKTOP (Windows, Mac, Chromebook) */}
      {activeTab === 'desktop' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border-2 border-pink-500/60 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              Desktop PWA App
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Laptop size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Standalone Desktop App for {detectedOS === 'mac' ? 'macOS' : 'Windows & PC'}
                  </h2>
                  <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                    Clean dedicated window • Pins to Taskbar & Start Menu • Zero browser tab clutter
                  </p>
                </div>
              </div>

              {/* Desktop Feature Perks */}
              <div className="grid grid-cols-2 gap-2 text-xs text-white font-medium">
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Standalone app window</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Pin to Taskbar & Start</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Desktop chat notifications</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Lightning fast startup</span>
                </div>
              </div>

              {/* Install Button */}
              <button
                onClick={handleInstallClick}
                className="w-full min-h-[48px] rounded-2xl gradient-bg text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-95 transition-all hover:opacity-95 cursor-pointer"
              >
                <Laptop size={18} />
                <span>
                  {installed
                    ? '✓ App Already Installed on this Device!'
                    : deferredPrompt
                    ? 'Install DPS Buzz on this PC (1-Click)'
                    : 'How to Install on Chrome / Edge (Click to view)'}
                </span>
              </button>

              {/* Step-by-Step Desktop Guide (Shows automatically if no prompt or toggle) */}
              <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor size={14} /> Desktop Install Steps (Chrome, Edge & Brave)
                  </span>
                  <button
                    onClick={() => setShowDesktopHelp(!showDesktopHelp)}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    {showDesktopHelp ? 'Hide guide' : 'Show details'}
                  </button>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex items-start gap-2.5 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Option A — Address Bar Icon:</strong>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Look at the right side of your browser URL/address bar at the very top. Click the <strong>Install App icon (📥 / computer screen icon)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Option B — Browser Menu:</strong>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Click the <strong>Three Dots menu (⋮)</strong> in the top-right corner of Chrome or Edge &rarr; Click <strong>&quot;Install DPS Buzz...&quot;</strong> (or <em>Save and share &rarr; Install page as app</em>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Done & Pin to Taskbar:</strong>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Click <strong>&quot;Install&quot;</strong> in the confirmation popup. Right-click the app icon on your Windows Taskbar and select <strong>&quot;Pin to taskbar&quot;</strong> for instant 1-click access anytime!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANDROID (PWA & APK v1.4) */}
      {activeTab === 'android' && (
        <div className="space-y-6">
          {/* Method 1: Instant PWA */}
          <div className="bg-zinc-900 border-2 border-pink-500/60 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              Recommended
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Method 1: Instant 1-Tap Home Screen App</h2>
                  <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                    0 MB storage • Auto-updates silently • Zero install warnings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-white font-medium">
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Full-screen app icon</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Silent cloud updates</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Zero Play Store hassle</span>
                </div>
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/80 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>100% Private & Safe</span>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full min-h-[46px] rounded-2xl gradient-bg text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-95 transition-all hover:opacity-95 cursor-pointer"
              >
                <Smartphone size={18} />
                <span>{installed ? '✓ App Already Installed!' : 'Install App to Home Screen'}</span>
              </button>

              {showAndroidHelp && !deferredPrompt && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1.5">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Info size={14} className="text-pink-400" /> In Android Chrome:
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Tap the <strong>3 dots (⋮)</strong> in the top-right corner of Chrome &rarr; Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Method 2: Android APK Direct Download */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 md:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Download size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Method 2: Standalone Android APK</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    .apk v1.4
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                  Direct package for Android phones • Shareable via WhatsApp or Bluetooth
                </p>
              </div>
            </div>

            {downloadStarted && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Downloading <strong>DPS_Buzz.apk</strong>... Check your notifications or downloads folder.</span>
              </div>
            )}

            <button
              onClick={handleApkDownload}
              className="w-full min-h-[46px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Download size={18} />
              <span>Download Android APK (DPS_Buzz.apk)</span>
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
                    desc: 'Tap the button above. The file "DPS_Buzz.apk" will download to your phone storage.',
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
                    className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center">
                          {item.step}
                        </span>
                        <span className="text-xs font-bold text-white">{item.title}</span>
                      </div>
                      {activeStep === item.step ? (
                        <ChevronUp size={16} className="text-zinc-400" />
                      ) : (
                        <ChevronDown size={16} className="text-zinc-400" />
                      )}
                    </div>
                    {activeStep === item.step && (
                      <p className="text-xs text-zinc-300 mt-2 pl-7 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IPHONE / IPAD (Safari Home Screen) */}
      {activeTab === 'ios' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border-2 border-pink-500/60 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0">
                <Apple size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Install on iPhone & iPad</h2>
                <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                  Add to your iOS Home Screen via Safari in 2 quick steps
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    Open in Safari & Tap Share <Share2 size={14} className="text-blue-400" />
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    Make sure you are viewing this page in <strong>Safari</strong> (Apple requires Safari to add apps). Tap the <strong>Share button (square with arrow pointing up ⬆️)</strong> at the bottom of the screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white">
                    Tap &quot;Add to Home Screen&quot; (+)
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    Scroll down through the share options and tap <strong>&quot;Add to Home Screen&quot;</strong>. Then tap <strong>&quot;Add&quot;</strong> in the top-right corner.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>The DPS Buzz icon will now appear on your iPhone home screen just like an App Store app!</span>
            </div>
          </div>
        </div>
      )}

      {/* Strict Privacy & Confidentiality Guarantee Box */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
          <Lock size={15} className="text-amber-400" />
          <span className="text-white">Strict Privacy & Confidentiality</span>
        </div>

        <ul className="text-xs text-zinc-300 space-y-2.5 leading-relaxed font-medium">
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🤫</span>
            <span>
              <strong className="text-white">Zero Public Store Listing:</strong> We deliberately avoid the public Play Store and App Store so no external parties or public reviewers index the app.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🚫</span>
            <span>
              <strong className="text-white">No Search Engine Indexing:</strong> The platform is strictly shielded with <code>noindex</code> headers. Search engines will never index student pages.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">🔑</span>
            <span>
              <strong className="text-white">Private School Invite Code:</strong> Accounts can only be created with your valid school admission number and secret invite code.
            </span>
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

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen px-4 py-12 flex items-center justify-center text-center">
          <div className="space-y-3">
            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading installation options...</p>
          </div>
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
