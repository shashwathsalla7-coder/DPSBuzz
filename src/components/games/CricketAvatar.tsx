'use client';

import React, { useState } from 'react';
import type { Cricketer } from '@/data/cricketers';
import { Shield, Info, ExternalLink } from 'lucide-react';

interface CricketAvatarProps {
  cricketer: Partial<Cricketer>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showAttribution?: boolean;
}

const SIZE_MAP = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-10 h-10 text-xs',
  md: 'w-14 h-14 text-sm',
  lg: 'w-20 h-20 text-base',
  xl: 'w-28 h-28 text-xl',
  '2xl': 'w-36 h-36 text-2xl',
};

// Distinct team colors for SVG avatar jersey badges
const COUNTRY_COLORS: Record<string, { bg: string; text: string }> = {
  India: { bg: 'from-blue-600 to-indigo-900', text: 'text-amber-300' },
  Australia: { bg: 'from-yellow-500 to-emerald-800', text: 'text-amber-100' },
  England: { bg: 'from-red-600 to-blue-900', text: 'text-white' },
  'South Africa': { bg: 'from-emerald-600 to-yellow-600', text: 'text-white' },
  'West Indies': { bg: 'from-rose-800 to-amber-600', text: 'text-amber-200' },
  'New Zealand': { bg: 'from-slate-800 to-zinc-950', text: 'text-white' },
  Pakistan: { bg: 'from-emerald-700 to-teal-950', text: 'text-white' },
  'Sri Lanka': { bg: 'from-blue-700 to-amber-600', text: 'text-amber-300' },
  Afghanistan: { bg: 'from-blue-600 to-red-700', text: 'text-white' },
  Bangladesh: { bg: 'from-emerald-800 to-red-600', text: 'text-white' },
};

export function CricketAvatar({
  cricketer,
  size = 'md',
  className = '',
  showAttribution = false,
}: CricketAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [showMetaPopover, setShowMetaPopover] = useState(false);

  const imgMeta = cricketer.imageMeta;
  const photoUrl = imgMeta?.thumbnailUrl || imgMeta?.imageUrl;
  const hasValidPhoto = Boolean(photoUrl) && !imgError;

  const initials = (cricketer.name || 'CR')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const countryStyle =
    COUNTRY_COLORS[cricketer.country || ''] || {
      bg: 'from-blue-700 to-slate-900',
      text: 'text-cyan-300',
    };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`${SIZE_MAP[size]} rounded-2xl overflow-hidden relative shadow-md border border-white/10 flex items-center justify-center shrink-0 bg-slate-900`}
      >
        {hasValidPhoto ? (
          <img
            src={photoUrl!}
            alt={cricketer.name || 'Cricketer photo'}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* High quality Cricket Jersey Default Avatar */
          <div
            className={`w-full h-full bg-gradient-to-br ${countryStyle.bg} flex flex-col items-center justify-center relative p-1`}
          >
            {/* Cricket Bat & Ball SVG Watermark */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute inset-0 w-full h-full text-white/10 p-2 pointer-events-none"
            >
              <path d="M14 2l6 6-9 9-6-6 9-9z" />
              <path d="M4 16l4 4" />
              <circle cx="18" cy="18" r="3" />
            </svg>

            <span className={`font-black tracking-wider ${countryStyle.text} drop-shadow-sm z-10 leading-none`}>
              {initials}
            </span>

            {cricketer.jerseyNumber && size !== 'xs' && (
              <span className="text-[9px] font-bold text-white/80 z-10 mt-0.5">
                #{cricketer.jerseyNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attribution info badge */}
      {showAttribution && hasValidPhoto && imgMeta && (
        <div className="absolute -bottom-1 -right-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMetaPopover(!showMetaPopover);
            }}
            className="w-4 h-4 rounded-full bg-black/80 hover:bg-blue-600 text-[9px] text-white flex items-center justify-center border border-white/20 shadow-xs cursor-pointer transition-colors"
            title="Image License & Attribution"
          >
            ©
          </button>

          {showMetaPopover && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 right-0 z-50 w-56 p-2.5 rounded-xl bg-slate-900/95 border border-blue-500/30 text-white text-[10px] space-y-1.5 shadow-2xl backdrop-blur-md animate-fade-in"
            >
              <div className="flex items-center justify-between font-bold text-cyan-300 border-b border-white/10 pb-1">
                <span>Wikimedia Commons</span>
                <span className="text-[9px] text-emerald-400 font-semibold">
                  {imgMeta.licenseName || 'Free License'}
                </span>
              </div>
              <p className="text-slate-300 leading-tight">
                {imgMeta.attributionText || `Photo of ${cricketer.name}`}
              </p>
              {imgMeta.sourcePageUrl && (
                <a
                  href={imgMeta.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-semibold pt-0.5"
                >
                  <span>View Source Page</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
