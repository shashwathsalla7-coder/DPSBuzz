'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Laptop, X } from 'lucide-react';

export const GetAppWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Never show on phones (only desktop screens >= 768px)
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 768 || /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    if (isMobile) return;

    // Check if user already dismissed it
    const dismissed = localStorage.getItem('dpsbuzz_desktop_banner_dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('dpsbuzz_desktop_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="hidden md:flex mx-4 my-2 px-3 py-2 rounded-[12px] border border-[var(--line)] bg-[var(--surface-sunken)] items-center justify-between text-xs select-none">
      <div className="flex items-center gap-2 text-[var(--text)] font-medium">
        <Laptop size={16} className="text-[var(--primary)] shrink-0" />
        <span>Install DPS Buzz on your laptop for quick access and instant notifications.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/download?platform=desktop"
          className="px-3 py-1 rounded-full bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
        >
          Download
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
          aria-label="Dismiss desktop app notice"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default GetAppWidget;
