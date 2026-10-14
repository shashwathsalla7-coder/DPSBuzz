'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, X } from 'lucide-react';

export const GetAppWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If running inside native Android APK or installed standalone PWA, auto-hide
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    const ua = window.navigator.userAgent.toLowerCase();
    const isNative = ua.includes('dpsbuzz') || Boolean((window as unknown as { AndroidBridge?: unknown }).AndroidBridge);

    if (isStandalone || isNative) {
      return;
    }

    const dismissed = localStorage.getItem('dpsbuzz_getapp_widget_closed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mx-3 my-2.5 p-3 rounded-[16px] border flex items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden animate-fade-in select-none">
      {/* Subtle brand glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

      {/* Left: App Icon + Details */}
      <Link href="/download" className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 p-1 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
          <img
            src="/icons/icon-192.png"
            alt="DPS Buzz App"
            className="w-full h-full rounded-lg object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight truncate">DPS Buzz App</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400">v1.3</span>
          </div>
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
            Official Android APK • 24/7 cloud server
          </p>
        </div>
      </Link>

      {/* Right: Action button + close */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/download"
          className="px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-sm shadow-pink-500/20 active:scale-95 hover:opacity-90 transition-all flex items-center gap-1"
        >
          <Download size={12} strokeWidth={2.5} />
          <span>Get App</span>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            localStorage.setItem('dpsbuzz_getapp_widget_closed', 'true');
          }}
          className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
          aria-label="Close widget"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default GetAppWidget;
