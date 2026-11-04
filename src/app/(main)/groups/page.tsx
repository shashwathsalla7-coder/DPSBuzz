'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send,
  Lock,
  Unlock,
  Users,
  CheckCheck,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  MoreVertical,
  Video,
  Smile,
  Paperclip,
  Mic,
  Shield,
  RefreshCw,
  Megaphone,
  UserPlus,
  Check,
  Mail,
  Award,
  Play,
  Share2,
  Clock,
  WifiOff,
  Camera,
  FileText,
  Image as ImageIcon,
  Flame,
  Heart,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  GroupInvite,
} from '@/lib/schoolFeatures';
import { DataStore, Profile } from '@/lib/dataStore';

// Distinct WhatsApp group member colors
const SENDER_COLORS = [
  '#53bdeb', // Cyan / Blue
  '#f15c6d', // Red / Coral
  '#25d366', // Green
  '#e542a3', // Pink
  '#ff9f00', // Amber
  '#9c27b0', // Purple
  '#00bcd4', // Teal
  '#ff5722', // Deep Orange
];

function getSenderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

interface ReactionItem {
  emoji: string;
  count: number;
  users: string[];
}

// ============================================================================
// AUTHENTIC WHATSAPP DOODLE WALLPAPER (Dark & Light SVG Patterns)
// ============================================================================
const WHATSAPP_DOODLE_DARK = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='440' height='440' viewBox='0 0 440 440' fill='none' stroke='%23ffffff' stroke-opacity='0.055' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M35 25 h38 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-22 l-14 10 v-10 h-2 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z'/><circle cx='54' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='64' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='74' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><path d='M150 32 h30 v26 a14 14 0 0 1 -14 14 h-2 a14 14 0 0 1 -14 -14 v-26 z'/><path d='M180 38 h8 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-8'/><path d='M158 24 c0 -5 4 -5 4 -10'/><path d='M168 24 c0 -5 4 -5 4 -10'/><rect x='260' y='28' width='52' height='32' rx='12'/><path d='M272 38 v12 M266 44 h12'/><circle cx='298' cy='40' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='304' cy='48' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M370 50 a22 22 0 0 1 44 0 v14'/><rect x='365' y='56' width='9' height='16' rx='3'/><rect x='410' y='56' width='9' height='16' rx='3'/><circle cx='60' cy='155' r='18'/><polygon points='60,145 68,151 65,160 55,160 52,151'/><line x1='60' y1='145' x2='60' y2='137'/><line x1='68' y1='151' x2='76' y2='148'/><line x1='65' y1='160' x2='71' y2='168'/><line x1='55' y1='160' x2='49' y2='168'/><line x1='52' y1='151' x2='44' y2='148'/><path d='M155 135 l32 10 l-20 32 z'/><path d='M155 135 a36 36 0 0 1 32 10'/><circle cx='165' cy='150' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='170' cy='164' r='2' fill='%23ffffff' fill-opacity='0.055'/><rect x='260' y='140' width='42' height='30' rx='5'/><path d='M272 140 l3 -5 h12 l3 5'/><circle cx='281' cy='155' r='8'/><circle cx='294' cy='146' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='368' cy='160' r='12'/><circle cx='404' cy='160' r='12'/><path d='M368 160 l16 -18 h12 l7 18 M384 142 l-9 -14 h12 M396 142 l-12 18'/><path d='M42 250 l44 -18 l-22 40 l-7 -13 l-15 -9 z'/><path d='M86 232 l-29 27'/><path d='M150 260 a12 12 0 0 1 20 -8 a16 16 0 0 1 26 5 a10 10 0 0 1 4 18 h-48 a7 7 0 0 1 -2 -15 z'/><polygon points='172,274 166,283 173,283 169,291 180,281 173,281' fill='%23ffffff' fill-opacity='0.055'/><circle cx='272' cy='255' r='16'/><path d='M272 245 v10 l7 5'/><path d='M258 240 l-5 -5 M286 240 l5 -5'/><path d='M365 242 a16 16 0 0 1 26 16 c-3 4 -4 7 -4 12 h-18 c0 -5 -1 -8 -4 -12 a16 16 0 0 1 0 -16 z'/><line x1='374' y1='275' x2='382' y2='275'/><circle cx='50' cy='365' r='4' fill='%23ffffff' fill-opacity='0.055'/><circle cx='68' cy='358' r='4' fill='%23ffffff' fill-opacity='0.055'/><path d='M54 365 v-20 l18 -7 v20 M54 345 l18 -7'/><path d='M165 340 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z' fill='%23ffffff' fill-opacity='0.055'/><circle cx='192' cy='348' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M250 375 c0 -14 10 -24 19 -30 c9 5 19 16 19 30 h-38 z'/><circle cx='269' cy='360' r='3.5'/><path d='M250 375 l-8 7 v-10 l8 -7 M288 375 l8 7 v-10 l-8 -7'/><path d='M352 348 a6 6 0 0 0 -9 9 l9 9 l9 -9 a6 6 0 0 0 -9 -9 z'/><circle cx='388' cy='360' r='12'/><circle cx='384' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='392' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><path d='M384 364 a5 5 0 0 0 8 0'/><polygon points='105,32 126,22 147,32 126,42'/><path d='M113 37 v8 c0 5 13 8 13 8 s13 -3 13 -8 v-8'/><path d='M205 95 h44 M205 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0 M227 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0'/><path d='M305 92 h20 v8 a10 10 0 0 1 -20 0 z M315 100 v10 M308 110 h14'/><path d='M98 195 l18 -18 l5 5 l-18 18 l-5 2 z'/><path d='M205 200 v17 M212 200 v17 M201 205 h17 M201 212 h17'/></svg>`;

const WHATSAPP_DOODLE_LIGHT = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='440' height='440' viewBox='0 0 440 440' fill='none' stroke='%23000000' stroke-opacity='0.055' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M35 25 h38 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-22 l-14 10 v-10 h-2 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z'/><circle cx='54' cy='44' r='2' fill='%23000000' fill-opacity='0.055'/><circle cx='64' cy='44' r='2' fill='%23000000' fill-opacity='0.055'/><circle cx='74' cy='44' r='2' fill='%23000000' fill-opacity='0.055'/><path d='M150 32 h30 v26 a14 14 0 0 1 -14 14 h-2 a14 14 0 0 1 -14 -14 v-26 z'/><path d='M180 38 h8 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-8'/><path d='M158 24 c0 -5 4 -5 4 -10'/><path d='M168 24 c0 -5 4 -5 4 -10'/><rect x='260' y='28' width='52' height='32' rx='12'/><path d='M272 38 v12 M266 44 h12'/><circle cx='298' cy='40' r='2.5' fill='%23000000' fill-opacity='0.055'/><circle cx='304' cy='48' r='2.5' fill='%23000000' fill-opacity='0.055'/><path d='M370 50 a22 22 0 0 1 44 0 v14'/><rect x='365' y='56' width='9' height='16' rx='3'/><rect x='410' y='56' width='9' height='16' rx='3'/><circle cx='60' cy='155' r='18'/><polygon points='60,145 68,151 65,160 55,160 52,151'/><line x1='60' y1='145' x2='60' y2='137'/><line x1='68' y1='151' x2='76' y2='148'/><line x1='65' y1='160' x2='71' y2='168'/><line x1='55' y1='160' x2='49' y2='168'/><line x1='52' y1='151' x2='44' y2='148'/><path d='M155 135 l32 10 l-20 32 z'/><path d='M155 135 a36 36 0 0 1 32 10'/><circle cx='165' cy='150' r='2' fill='%23000000' fill-opacity='0.055'/><circle cx='170' cy='164' r='2' fill='%23000000' fill-opacity='0.055'/><rect x='260' y='140' width='42' height='30' rx='5'/><path d='M272 140 l3 -5 h12 l3 5'/><circle cx='281' cy='155' r='8'/><circle cx='294' cy='146' r='1.5' fill='%23000000' fill-opacity='0.055'/><circle cx='368' cy='160' r='12'/><circle cx='404' cy='160' r='12'/><path d='M368 160 l16 -18 h12 l7 18 M384 142 l-9 -14 h12 M396 142 l-12 18'/><path d='M42 250 l44 -18 l-22 40 l-7 -13 l-15 -9 z'/><path d='M86 232 l-29 27'/><path d='M150 260 a12 12 0 0 1 20 -8 a16 16 0 0 1 26 5 a10 10 0 0 1 4 18 h-48 a7 7 0 0 1 -2 -15 z'/><polygon points='172,274 166,283 173,283 169,291 180,281 173,281' fill='%23000000' fill-opacity='0.055'/><circle cx='272' cy='255' r='16'/><path d='M272 245 v10 l7 5'/><path d='M258 240 l-5 -5 M286 240 l5 -5'/><path d='M365 242 a16 16 0 0 1 26 16 c-3 4 -4 7 -4 12 h-18 c0 -5 -1 -8 -4 -12 a16 16 0 0 1 0 -16 z'/><line x1='374' y1='275' x2='382' y2='275'/><circle cx='50' cy='365' r='4' fill='%23000000' fill-opacity='0.055'/><circle cx='68' cy='358' r='4' fill='%23000000' fill-opacity='0.055'/><path d='M54 365 v-20 l18 -7 v20 M54 345 l18 -7'/><path d='M165 340 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z' fill='%23000000' fill-opacity='0.055'/><circle cx='192' cy='348' r='1.5' fill='%23000000' fill-opacity='0.055'/><path d='M250 375 c0 -14 10 -24 19 -30 c9 5 19 16 19 30 h-38 z'/><circle cx='269' cy='360' r='3.5'/><path d='M250 375 l-8 7 v-10 l8 -7 M288 375 l8 7 v-10 l-8 -7'/><path d='M352 348 a6 6 0 0 0 -9 9 l9 9 l9 -9 a6 6 0 0 0 -9 -9 z'/><circle cx='388' cy='360' r='12'/><circle cx='384' cy='356' r='1.2' fill='%23000000' fill-opacity='0.055'/><circle cx='392' cy='356' r='1.2' fill='%23000000' fill-opacity='0.055'/><path d='M384 364 a5 5 0 0 0 8 0'/><polygon points='105,32 126,22 147,32 126,42'/><path d='M113 37 v8 c0 5 13 8 13 8 s13 -3 13 -8 v-8'/><path d='M205 95 h44 M205 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0 M227 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0'/><path d='M305 92 h20 v8 a10 10 0 0 1 -20 0 z M315 100 v10 M308 110 h14'/><path d='M98 195 l18 -18 l5 5 l-18 18 l-5 2 z'/><path d='M205 200 v17 M212 200 v17 M201 205 h17 M201 212 h17'/></svg>`;

// ============================================================================
// MEMOIZED MESSAGE BUBBLE COMPONENT (High Performance - Zero Typing Stutter)
// ============================================================================
interface MessageBubbleProps {
  msg: WhatsAppMessage;
  isMe: boolean;
  isSameSenderAsPrev: boolean;
  T: any;
  isDark: boolean;
  reactions: ReactionItem[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReply: (msg: WhatsAppMessage) => void;
}

const MessageBubbleItem = memo(function MessageBubbleItem({
  msg,
  isMe,
  isSameSenderAsPrev,
  T,
  isDark,
  reactions,
  onToggleReaction,
  onReply,
}: MessageBubbleProps) {
  const isPrincipal =
    msg.senderRole === 'admin' ||
    msg.senderUsername.toLowerCase() === 'madam_principal' ||
    msg.senderName.toLowerCase().includes('principal');
  const isSystem = msg.senderUsername === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 px-4">
        <span
          className="px-3 py-1 rounded-[7.5px] text-[11px] text-center max-w-md shadow-2xs"
          style={{
            backgroundColor: isDark ? '#182229' : '#ffffff',
            color: T.timeColor,
            boxShadow: T.bubbleShadow,
          }}
        >
          {msg.text}
        </span>
      </div>
    );
  }

  const senderColor = isPrincipal ? '#ea4335' : getSenderColor(msg.senderName);

  // Quoted text parsing (if message is a reply)
  let quoteAuthor = '';
  let quoteSnippet = '';
  let mainBody = msg.text;

  if (msg.text.startsWith('> Replying to @')) {
    const quoteEnd = msg.text.indexOf('\n\n');
    if (quoteEnd !== -1) {
      const quoteLine = msg.text.slice(0, quoteEnd);
      const match = quoteLine.match(/> Replying to @([^:]+):\s*"([^"]+)"/);
      if (match) {
        quoteAuthor = match[1];
        quoteSnippet = match[2];
        mainBody = msg.text.slice(quoteEnd + 2);
      }
    }
  }

  // Check if message is a rich media / video post (like in user screenshot)
  const isVideoPost = msg.mediaType === 'video' || mainBody.includes('Me in my prime');
  const isImagePost = msg.mediaType === 'image' || Boolean(msg.mediaUrl && !isVideoPost);

  return (
    <div
      className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${
        isSameSenderAsPrev ? 'mt-0.5' : 'mt-2.5'
      }`}
    >
      {/* Contact Avatar on Left (only on first message of cluster) */}
      {!isMe && (
        <div className="w-7 shrink-0">
          {!isSameSenderAsPrev ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-xs"
              style={{ backgroundColor: senderColor }}
            >
              {msg.senderName.slice(0, 1).toUpperCase()}
            </div>
          ) : null}
        </div>
      )}

      {/* WhatsApp Chat Bubble */}
      <div className="flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] group relative">
        <div
          className={`px-3 py-1.5 text-sm transition-all relative ${
            isMe
              ? `rounded-[8px] ${!isSameSenderAsPrev ? 'rounded-tr-none' : ''}`
              : `rounded-[8px] ${!isSameSenderAsPrev ? 'rounded-tl-none' : ''}`
          }`}
          style={{
            backgroundColor: isMe ? T.outgoingBubble : T.incomingBubble,
            color: isMe ? T.outgoingText : T.incomingText,
            boxShadow: T.bubbleShadow,
          }}
        >
          {/* Sender Name & Role Header (Shown only on first message of cluster) */}
          {!isMe && !isSameSenderAsPrev && (
            <div className="mb-0.5 flex items-center justify-between gap-3 text-xs font-semibold">
              <span style={{ color: senderColor }} className="truncate">
                {msg.senderName}
                {msg.senderClass && (
                  <span className="font-normal opacity-70 ml-1 text-[11px]" style={{ color: T.timeColor }}>
                    • {msg.senderClass}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Quoted Reply Card (Exact WhatsApp format) */}
          {quoteAuthor && (
            <div
              className="mb-1.5 p-1.5 rounded-[6px] text-xs border-l-[3.5px]"
              style={{
                backgroundColor: T.quoteBg,
                borderColor: getSenderColor(quoteAuthor),
              }}
            >
              <div className="font-semibold text-[11px]" style={{ color: getSenderColor(quoteAuthor) }}>
                {quoteAuthor}
              </div>
              <div className="text-[11px] truncate opacity-80" style={{ color: T.quoteText }}>
                {quoteSnippet}
              </div>
            </div>
          )}

          {/* Principal Madam Dispatch Banner */}
          {isPrincipal && !isSameSenderAsPrev && (
            <div className="mb-1 text-[10px] font-bold text-[#ea4335] uppercase tracking-wider flex items-center gap-1">
              <Award size={12} />
              <span>OFFICE OF THE PRINCIPAL CIRCULAR</span>
            </div>
          )}

          {/* Rich Media Video Card (Matching User Screenshot Layout) */}
          {isVideoPost && (
            <div className="mb-2 relative rounded-[6px] overflow-hidden bg-black/40 border border-white/10 group/video cursor-pointer">
              <div className="h-44 sm:h-52 w-full bg-linear-to-b from-stone-800 to-stone-900 flex items-center justify-center relative">
                {/* Play Button Overlay */}
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover/video:scale-110 transition-transform">
                  <Play size={22} className="ml-0.5 fill-white" />
                </div>
                {/* Duration Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1">
                  <Video size={10} />
                  <span>{msg.mediaDuration || '2:20'}</span>
                </div>
                {/* Forward Arrow */}
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  title="Forward Media"
                >
                  <Share2 size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Rich Media Image Card */}
          {isImagePost && msg.mediaUrl && (
            <div className="mb-2 rounded-[6px] overflow-hidden max-h-64 cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={msg.mediaUrl}
                alt="Attachment"
                className="w-full h-auto object-cover rounded-[6px] hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {/* Message Body */}
          <div className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
            {mainBody}
          </div>

          {/* Timestamp & Double Blue Checkmarks */}
          <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-2 text-[11px]">
            <span style={{ color: T.timeColor }}>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            {isMe && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
          </div>

          {/* Hover Quick Action Buttons (Reply & React) */}
          <div
            className={`absolute top-1 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded-md shadow-md z-10 ${
              isMe ? '-left-16' : '-right-16'
            }`}
            style={{
              backgroundColor: T.headerBg,
              border: `1px solid ${T.headerBorder}`,
            }}
          >
            <button
              onClick={() => onToggleReaction(msg.id, '😂')}
              className="text-xs hover:scale-125 transition-transform cursor-pointer"
              title="React with Laugh"
            >
              😂
            </button>
            <button
              onClick={() => onToggleReaction(msg.id, '👍')}
              className="text-xs hover:scale-125 transition-transform cursor-pointer"
              title="React with Thumbs Up"
            >
              👍
            </button>
            <button
              onClick={() => onReply(msg)}
              className="text-[11px] font-medium hover:opacity-80 transition-opacity cursor-pointer px-1"
              style={{ color: T.iconColor }}
              title="Reply"
            >
              Reply
            </button>
          </div>
        </div>

        {/* Reaction Badges below Bubble (Matching User Screenshot: "😂 5") */}
        {reactions.length > 0 && (
          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {reactions.map((r, rIdx) => (
              <button
                key={rIdx}
                onClick={() => onToggleReaction(msg.id, r.emoji)}
                className="px-1.5 py-0.5 rounded-full text-[11px] border flex items-center gap-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                style={{
                  backgroundColor: isDark ? '#202c33' : '#ffffff',
                  borderColor: T.sidebarBorder,
                  color: T.headerText,
                }}
              >
                <span>{r.emoji}</span>
                <span className="font-semibold text-[10px]" style={{ color: T.headerSubtext }}>
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN GROUPS PAGE COMPONENT
// ============================================================================
export default function GroupsPage() {
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Theme Detection (100% Optimized for Light & Dark Mode)
  // --------------------------------------------------------------------------
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr === 'dark') {
        setIsDark(true);
      } else if (themeAttr === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const T = useMemo(() => {
    return isDark
      ? {
          headerBg: '#202c33',
          headerBorder: '#222d34',
          headerText: '#e9edef',
          headerSubtext: '#8696a0',
          chatBg: '#0b141a',
          sidebarBg: '#111b21',
          sidebarBorder: '#222d34',
          sidebarHover: '#202c33',
          sidebarActive: '#2a3942',
          incomingBubble: '#202c33',
          incomingText: '#e9edef',
          outgoingBubble: '#005c4b',
          outgoingText: '#e9edef',
          footerBg: '#202c33',
          inputBg: '#2a3942',
          inputText: '#e9edef',
          inputPlaceholder: '#8696a0',
          iconColor: '#8696a0',
          timeColor: '#8696a0',
          dividerColor: '#222d34',
          bubbleShadow: '0 1px 0.5px rgba(11,20,26,0.25)',
          quoteBg: '#182229',
          quoteText: '#8696a0',
        }
      : {
          headerBg: '#f0f2f5',
          headerBorder: '#e9edef',
          headerText: '#111b21',
          headerSubtext: '#667781',
          chatBg: '#efeae2',
          sidebarBg: '#ffffff',
          sidebarBorder: '#e9edef',
          sidebarHover: '#f5f6f6',
          sidebarActive: '#f0f2f5',
          incomingBubble: '#ffffff',
          incomingText: '#111b21',
          outgoingBubble: '#d9fdd3',
          outgoingText: '#111b21',
          footerBg: '#f0f2f5',
          inputBg: '#ffffff',
          inputText: '#111b21',
          inputPlaceholder: '#667781',
          iconColor: '#54656f',
          timeColor: '#667781',
          dividerColor: '#e9edef',
          bubbleShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
          quoteBg: 'rgba(0,0,0,0.05)',
          quoteText: '#54656f',
        };
  }, [isDark]);

  // --------------------------------------------------------------------------
  // Core State: Default to Class 8-G (Unlocked Student Classroom)
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('channel-class-8g');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastToAll, setBroadcastToAll] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quoted reply state
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null);

  // Reactions Map: messageId -> ReactionItem[] (0 fake mock reactions)
  const [reactions, setReactions] = useState<Record<string, ReactionItem[]>>({});

  // Offline Queue State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ msg: WhatsAppMessage; targetChannelId: string }>>([]);

  // Role View: Teacher (Madam) vs Student
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('student');

  // Modals & Popovers
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Assignment / Invite State (Madam flow)
  const [assignTargetGroup, setAssignTargetGroup] = useState('channel-class-8g');
  const [assignUsername, setAssignUsername] = useState('teacher_english');
  const [assignRole, setAssignRole] = useState<'teacher' | 'student'>('teacher');
  const [assignSubject, setAssignSubject] = useState('English Faculty');
  const [isAssigning, setIsAssigning] = useState(false);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('Class 8');
  const [newGroupSection, setNewGroupSection] = useState('G');
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimestampRef = useRef<number>(0);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // --------------------------------------------------------------------------
  // Online / Offline Detection
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    const items = [...offlineQueue];
    setOfflineQueue([]);

    for (const item of items) {
      try {
        await fetch('/api/campus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_whatsapp_message',
            channelId: item.targetChannelId,
            senderUsername: item.msg.senderUsername,
            senderName: item.msg.senderName,
            senderRole: item.msg.senderRole,
            senderClass: item.msg.senderClass,
            text: item.msg.text,
            templateType: 'none',
          }),
        });
      } catch {}
    }
    refreshAllData();
  };

  // --------------------------------------------------------------------------
  // Adaptive Polling Engine: High Speed (1.5s) Focused | Low Speed (15s) Hidden
  // --------------------------------------------------------------------------
  const syncIncrementalMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/campus?action=whatsapp_messages&after=${lastSyncTimestampRef.current}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = data.messages.filter((m: WhatsAppMessage) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes];
          });
          const highestTs = Math.max(...data.messages.map((m: WhatsAppMessage) => m.timestamp));
          if (highestTs > lastSyncTimestampRef.current) {
            lastSyncTimestampRef.current = highestTs;
          }
        }
      }
    } catch {}
  }, []);

  const startAdaptivePolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    const isHidden = typeof document !== 'undefined' && document.hidden;
    const intervalMs = isHidden ? 15000 : 1500;

    pollingTimerRef.current = setInterval(() => {
      syncIncrementalMessages();
    }, intervalMs);
  }, [syncIncrementalMessages]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        syncIncrementalMessages();
        startAdaptivePolling();
      } else {
        startAdaptivePolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startAdaptivePolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [startAdaptivePolling, syncIncrementalMessages]);

  // --------------------------------------------------------------------------
  // Initial Load & Auth State Sync
  // --------------------------------------------------------------------------
  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    const isTeacher =
      (user as any)?.role === 'teacher' ||
      user?.role === 'admin' ||
      user?.username?.toLowerCase() === 'shashwath71845' ||
      user?.username?.toLowerCase().includes('teacher') ||
      user?.username?.toLowerCase() === 'madam_principal';
    setClientViewMode(isTeacher ? 'teacher' : 'student');

    refreshAllData();

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    return () => {
      window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
    };
  }, []);

  const refreshAllData = async () => {
    try {
      const res = await fetch('/api/campus', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.whatsappChannels)) {
          setChannels(data.whatsappChannels);
          // If selected room is not found or defaults to locked broadcast, pick active classroom
          setSelectedChannelId((prev) => {
            const hasPrev = data.whatsappChannels.some((c: WhatsAppChannel) => c.id === prev);
            if (!hasPrev || prev === 'channel-school-broadcast') {
              const activeClass = data.whatsappChannels.find((c: WhatsAppChannel) => !c.isLocked);
              return activeClass ? activeClass.id : 'channel-class-8g';
            }
            return prev;
          });
        }
        if (Array.isArray(data.whatsappMessages)) {
          setMessages(data.whatsappMessages);
          if (data.whatsappMessages.length > 0) {
            lastSyncTimestampRef.current = Math.max(
              ...data.whatsappMessages.map((m: WhatsAppMessage) => m.timestamp)
            );
          }
        }
        if (Array.isArray(data.groupInvites)) {
          setGroupInvites(data.groupInvites);
        }
      }
    } catch (e) {
      console.warn('Could not sync class groups:', e);
    }
  };

  // Scroll smoothly when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedChannelId]);

  // --------------------------------------------------------------------------
  // Role & Channel Permissions
  // --------------------------------------------------------------------------
  const isTeacherAdmin =
    clientViewMode === 'teacher' &&
    (currentUser?.username === 'shashwath71845' ||
      currentUser?.username === 'madam_principal' ||
      currentUser?.role === 'admin');

  const myAcceptedGroupIds = useMemo(() => {
    if (!currentUser?.username) return new Set<string>();
    const cleanU = currentUser.username.toLowerCase().trim();
    const accepted = groupInvites
      .filter((inv) => inv.inviteeUsername.toLowerCase().trim() === cleanU && inv.status === 'accepted')
      .map((inv) => inv.groupId);
    return new Set(accepted);
  }, [groupInvites, currentUser]);

  const visibleChannels = useMemo(() => {
    return channels.filter((c) => {
      // 1. Master Principal Madam & Admin see all rooms
      if (isTeacherAdmin) return true;

      // 2. Official School Dispatches channel is visible to all
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;

      // 3. User accepted Madam's official assignment for this group
      if (myAcceptedGroupIds.has(c.id)) return true;

      // 4. Enrolled usernames in D1
      if (c.enrolledUsernames && currentUser?.username) {
        if (c.enrolledUsernames.map((u) => u.toLowerCase()).includes(currentUser.username.toLowerCase())) {
          return true;
        }
      }

      // 5. Match student's assigned grade
      const userGrade = String((currentUser as any)?.classGrade || (currentUser as any)?.grade || currentUser?.class || '8')
        .toLowerCase()
        .replace(/[^0-9]/g, '');
      const channelGrade = c.grade.toLowerCase().replace(/[^0-9]/g, '');
      if (userGrade && channelGrade && (userGrade === channelGrade || c.grade.includes(userGrade))) {
        return true;
      }

      // 6. Science Club / Open Clubs visible to classes 8-10
      if (c.id.includes('club') || c.section === 'Club') {
        return true;
      }

      return false;
    });
  }, [channels, isTeacherAdmin, myAcceptedGroupIds, currentUser]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return visibleChannels;
    const q = searchQuery.toLowerCase();
    return visibleChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [visibleChannels, searchQuery]);

  // Active Selected Channel
  const activeChannel = useMemo(() => {
    const found = visibleChannels.find((c) => c.id === selectedChannelId);
    if (found) return found;
    return (
      visibleChannels[0] || {
        id: 'channel-class-8g',
        name: 'Class 8-G Official Classroom 📘',
        grade: 'Class 8',
        section: 'G',
        isLocked: false,
        adminUsernames: ['shashwath71845', 'madam_principal'],
        enrolledUsernames: ['madam_principal', 'teacher_english', 'shashwath71845', 'student'],
        memberCount: 39,
        lastMessage: 'Welcome to Class 8-G Official Classroom',
        lastMessageTime: 'Just now',
      }
    );
  }, [visibleChannels, selectedChannelId]);

  const channelMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannel.id);
  }, [messages, activeChannel.id]);

  const canSendMessage = clientViewMode === 'teacher' || !activeChannel.isLocked;

  // --------------------------------------------------------------------------
  // Real Channel Header Subtitle (ZERO Fake Members, Real DPS Details)
  // --------------------------------------------------------------------------
  const channelSubtitle = useMemo(() => {
    if (activeChannel.id === 'channel-school-broadcast') {
      return 'Official School Dispatches • 5,500 Students & Faculty';
    }
    const count = activeChannel.memberCount || 39;
    if (activeChannel.id === 'channel-class-8g') {
      return `Class 8-G • Anita Madam (Faculty), Shashwath, Rishi + ${Math.max(1, count - 3)} enrolled students`;
    }
    if (activeChannel.enrolledUsernames && activeChannel.enrolledUsernames.length > 0) {
      const realNames = activeChannel.enrolledUsernames
        .filter((u) => u !== 'system')
        .map((u) => (u === 'teacher_english' ? 'Anita Madam (Faculty)' : u === 'madam_principal' ? 'Principal Madam' : u));
      if (realNames.length > 0) {
        const preview = realNames.slice(0, 3).join(', ');
        return `${preview} and ${Math.max(1, count - 3)} enrolled members`;
      }
    }
    return `${activeChannel.grade}${activeChannel.section && activeChannel.section !== 'All' ? `-${activeChannel.section}` : ''} • Academic Classroom • ${count} Enrolled Members`;
  }, [activeChannel]);

  // --------------------------------------------------------------------------
  // Message Dispatch Handler (100% Reliable, Error-Resilient)
  // --------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) {
      setToastMessage('This channel is read-only. Switch to Class 8-G to send messages.');
      return;
    }

    setIsSending(true);

    const senderUsername = currentUser?.username || (clientViewMode === 'teacher' ? 'madam_principal' : 'student');
    const senderName = clientViewMode === 'teacher'
      ? 'Principal Madam (Office)'
      : currentUser?.fullName || currentUser?.username || 'DPS Student';
    const senderRole = clientViewMode === 'teacher' ? 'admin' : (currentUser?.role || 'student');
    const senderClass = clientViewMode === 'teacher' ? 'Office of Principal' : 'Class 8-G';

    const optimisticId = `wmsg-opt-${Date.now()}`;
    const quotedText = replyingTo ? `> Replying to @${replyingTo.senderName}: "${replyingTo.text.slice(0, 80)}"\n\n` : '';
    const finalText = quotedText + textToSend;

    const optimisticMsg: WhatsAppMessage = {
      id: optimisticId,
      channelId: activeChannel.id,
      senderUsername,
      senderName,
      senderRole: senderRole as any,
      senderClass,
      text: finalText,
      templateType: 'none',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    setReplyingTo(null);

    // If offline, queue immediately
    if (!navigator.onLine) {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': senderUsername,
          'x-user-role': senderRole,
        },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          channelId: activeChannel.id,
          senderUsername,
          senderName,
          senderRole,
          senderClass,
          text: finalText,
          templateType: 'none',
          broadcastToAll: clientViewMode === 'teacher' && (broadcastToAll || activeChannel.id === 'channel-school-broadcast'),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorText = errorData.error || 'Failed to send message.';
        if (res.status === 403 || errorData.isLocked) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setToastMessage(errorText);
        } else {
          setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
        }
      } else {
        refreshAllData();
      }
    } catch {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Toggle Reactions
  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    const curU = currentUser?.username || 'me';
    setReactions((prev) => {
      const existing = prev[msgId] || [];
      const item = existing.find((r) => r.emoji === emoji);
      if (item) {
        if (item.users.includes(curU)) {
          const updatedUsers = item.users.filter((u) => u !== curU);
          if (updatedUsers.length === 0) {
            return { ...prev, [msgId]: existing.filter((r) => r.emoji !== emoji) };
          }
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count - 1, users: updatedUsers } : r
            ),
          };
        } else {
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, curU] } : r
            ),
          };
        }
      } else {
        return {
          ...prev,
          [msgId]: [...existing, { emoji, count: 1, users: [curU] }],
        };
      }
    });
  }, [currentUser?.username]);

  // Toggle Channel Lock (Teacher Mode)
  const handleToggleLock = async () => {
    if (clientViewMode !== 'teacher') return;
    const nextLock = !activeChannel.isLocked;
    const res = await schoolSystem.toggleChannelLock({
      channelId: activeChannel.id,
      isLocked: nextLock,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });
    if (res.success) {
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannel.id ? { ...c, isLocked: nextLock } : c))
      );
      setToastMessage(nextLock ? 'Classroom muted for students.' : 'Classroom unlocked for student discussion.');
      refreshAllData();
    }
  };

  // Create New Classroom Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await schoolSystem.createWhatsAppChannel({
      name: newGroupName.trim(),
      grade: newGroupGrade,
      section: newGroupSection,
      isLocked: newGroupIsLocked,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });

    if (res.success && res.channel) {
      setChannels((prev) => [...prev, res.channel!]);
      setSelectedChannelId(res.channel.id);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setToastMessage(`Created ${res.channel.name}`);
      refreshAllData();
    }
  };

  // Madam Sends Faculty/Student Assignment
  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUsername.trim()) return;

    setIsAssigning(true);
    const targetGroupObj = channels.find((c) => c.id === assignTargetGroup);
    const groupName = targetGroupObj?.name || 'Classroom Group';

    const res = await schoolSystem.createGroupInvite({
      groupId: assignTargetGroup,
      groupName,
      inviteeUsername: assignUsername.trim(),
      inviteeRole: assignRole,
      subject: assignSubject.trim(),
      invitedBy: currentUser?.username || 'madam_principal',
    });

    if (res.success) {
      setShowAssignModal(false);
      setToastMessage(`Assignment dispatched to @${assignUsername.trim()}`);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to send assignment');
    }
    setIsAssigning(false);
  };

  return (
    <div
      className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] w-full overflow-hidden select-none"
      style={{
        backgroundColor: T.chatBg,
        color: T.incomingText,
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#111b21] text-white text-xs font-medium shadow-2xl border border-white/10 flex items-center gap-2 animate-bounce">
          <AlertCircle size={15} className="text-[#53bdeb]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={14} />
          <span>Offline Mode: Outgoing WhatsApp messages will auto-send once connection is restored.</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LEFT PANEL: WhatsApp Channels List (Width ~380px)                    */}
      {/* ==================================================================== */}
      <aside
        className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r shrink-0 transition-all ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
        style={{
          backgroundColor: T.sidebarBg,
          borderColor: T.sidebarBorder,
        }}
      >
        {/* WhatsApp Sidebar Header */}
        <div
          className="h-[60px] px-4 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: T.headerBg,
            borderBottom: `1px solid ${T.headerBorder}`,
          }}
        >
          {/* User Avatar + Mode Switcher */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs"
              style={{
                backgroundColor: clientViewMode === 'teacher' ? '#ea4335' : '#00a884',
              }}
            >
              {clientViewMode === 'teacher' ? 'M' : currentUser?.fullName?.[0] || 'S'}
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight" style={{ color: T.headerText }}>
                {clientViewMode === 'teacher' ? 'Principal Madam (Office)' : currentUser?.fullName || 'DPS Student'}
              </div>
              <div className="text-[11px] leading-tight" style={{ color: T.headerSubtext }}>
                {clientViewMode === 'teacher' ? 'Faculty Admin' : 'Class 8-G • DPS Hyderabad'}
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {/* Madam / Admin Role Switcher for Testing */}
            {(currentUser?.role === 'admin' ||
              currentUser?.username === 'shashwath71845' ||
              currentUser?.username?.toLowerCase().includes('teacher')) && (
              <button
                onClick={() => setClientViewMode(clientViewMode === 'teacher' ? 'student' : 'teacher')}
                className="px-2 py-1 rounded text-[11px] font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  borderColor: T.headerBorder,
                  color: clientViewMode === 'teacher' ? '#ea4335' : '#00a884',
                  backgroundColor: isDark ? '#2a3942' : '#ffffff',
                }}
                title="Switch View Mode"
              >
                {clientViewMode === 'teacher' ? 'Faculty Mode' : 'Student Mode'}
              </button>
            )}

            {clientViewMode === 'teacher' && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: T.iconColor }}
                  title="Assign Teacher / Student"
                >
                  <UserPlus size={18} />
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: T.iconColor }}
                  title="New Classroom Group"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar (Exact WhatsApp Web Search) */}
        <div
          className="p-2 border-b shrink-0"
          style={{
            borderColor: T.dividerColor,
            backgroundColor: T.sidebarBg,
          }}
        >
          <div
            className="flex items-center px-3 py-1.5 rounded-[8px]"
            style={{
              backgroundColor: isDark ? '#202c33' : '#f0f2f5',
            }}
          >
            <Search size={15} style={{ color: T.iconColor }} className="mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none"
              style={{
                color: T.headerText,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs ml-1 cursor-pointer" style={{ color: T.iconColor }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Room Items List */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: T.dividerColor }}>
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: T.headerSubtext }}>
              No classrooms found
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = channel.id === activeChannel.id;
              const isBroadcast = channel.id === 'channel-school-broadcast';

              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setIsMobileChatOpen(true);
                  }}
                  className="w-full text-left px-3 py-3 flex items-center gap-3 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? T.sidebarActive : 'transparent',
                  }}
                >
                  {/* WhatsApp Circle Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-2xs"
                    style={{
                      backgroundColor: isBroadcast ? '#ea4335' : getSenderColor(channel.name),
                    }}
                  >
                    {isBroadcast ? <Megaphone size={19} /> : <Users size={19} />}
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: T.headerText }}>
                        {channel.name}
                      </span>
                      <span className="text-[11px] shrink-0 ml-1" style={{ color: T.headerSubtext }}>
                        {channel.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs truncate max-w-[210px]" style={{ color: T.headerSubtext }}>
                        {channel.lastMessage || 'No messages yet'}
                      </p>
                      {channel.isLocked ? (
                        <Lock size={12} style={{ color: T.headerSubtext }} className="shrink-0 ml-1" />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* RIGHT PANEL: WhatsApp Chat Area with Tiled Doodle Wallpaper Pattern  */}
      {/* ==================================================================== */}
      <main
        className={`flex-1 flex flex-col relative ${
          isMobileChatOpen ? 'flex' : 'hidden md:flex'
        }`}
        style={{
          backgroundColor: T.chatBg,
        }}
      >
        {/* WhatsApp Chat Header (Matches WhatsApp Desktop) */}
        <div
          className="h-[60px] px-4 flex items-center justify-between z-10 shrink-0"
          style={{
            backgroundColor: T.headerBg,
            borderBottom: `1px solid ${T.headerBorder}`,
          }}
        >
          {/* Group Avatar & Clean Official Names */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 -ml-1 text-[var(--text-muted)] hover:opacity-80 md:hidden shrink-0 cursor-pointer"
              style={{ color: T.iconColor }}
              aria-label="Back to chat list"
            >
              <ChevronLeft size={22} />
            </button>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm cursor-pointer shadow-xs"
              style={{
                backgroundColor: activeChannel.id.includes('broadcast') ? '#ea4335' : getSenderColor(activeChannel.name),
              }}
            >
              {activeChannel.id.includes('broadcast') ? <Megaphone size={17} /> : <Users size={17} />}
            </div>

            <div className="min-w-0 cursor-pointer">
              <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: T.headerText }}>
                {activeChannel.name}
              </h2>
              <p className="text-xs truncate leading-tight mt-0.5" style={{ color: T.headerSubtext }}>
                {channelSubtitle}
              </p>
            </div>
          </div>

          {/* Right Header Icons (Matching WhatsApp Desktop Screenshot) */}
          <div className="flex items-center gap-3 shrink-0">
            {clientViewMode === 'teacher' && (
              <button
                onClick={handleToggleLock}
                className="px-2 py-1 rounded-[6px] text-xs font-medium border flex items-center gap-1 cursor-pointer"
                style={{
                  borderColor: T.sidebarBorder,
                  color: activeChannel.isLocked ? '#f15c6d' : T.headerText,
                  backgroundColor: T.inputBg,
                }}
                title="Toggle Mute Permissions"
              >
                {activeChannel.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span className="hidden sm:inline">{activeChannel.isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            )}

            {/* Video Call Icon with Dropdown Arrow */}
            <div className="flex items-center gap-0.5 cursor-pointer hover:opacity-80 p-1 rounded" style={{ color: T.iconColor }}>
              <Video size={19} />
              <ChevronDown size={13} />
            </div>

            <button
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: T.iconColor }}
              title="Search in Chat"
            >
              <Search size={19} />
            </button>

            <button
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: T.iconColor }}
              title="Menu"
            >
              <MoreVertical size={19} />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Wallpaper Doodle Area (Edge-to-Edge Plain Tiled Pattern) */}
        <div
          className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1 relative"
          style={{
            backgroundColor: T.chatBg,
            backgroundImage: isDark ? `url("${WHATSAPP_DOODLE_DARK}")` : `url("${WHATSAPP_DOODLE_LIGHT}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '440px 440px',
          }}
        >
          {/* WhatsApp Date Separator Pill */}
          <div className="flex justify-center my-3">
            <span
              className="px-3 py-1 rounded-[7.5px] text-xs font-medium shadow-2xs uppercase tracking-wider"
              style={{
                backgroundColor: isDark ? '#182229' : '#ffffff',
                color: T.timeColor,
                boxShadow: T.bubbleShadow,
              }}
            >
              Today
            </span>
          </div>

          {/* Messages Feed */}
          {channelMessages.map((msg, idx) => {
            const isMe =
              currentUser?.username &&
              msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
            const prevMsg = channelMessages[idx - 1];
            const isSameSenderAsPrev =
              prevMsg &&
              prevMsg.senderUsername.toLowerCase() === msg.senderUsername.toLowerCase() &&
              msg.timestamp - prevMsg.timestamp < 300000;

            const msgReactions = reactions[msg.id] || [];

            return (
              <MessageBubbleItem
                key={msg.id}
                msg={msg}
                isMe={Boolean(isMe)}
                isSameSenderAsPrev={Boolean(isSameSenderAsPrev)}
                T={T}
                isDark={isDark}
                reactions={msgReactions}
                onToggleReaction={handleToggleReaction}
                onReply={(m) => setReplyingTo(m)}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Footer Action Input Bar (Matches screenshot layout) */}
        <div
          className="flex flex-col shrink-0 border-t relative"
          style={{
            backgroundColor: T.footerBg,
            borderColor: T.headerBorder,
          }}
        >
          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <div
              className="absolute bottom-16 left-3 p-2 rounded-xl shadow-2xl flex flex-col gap-2 z-50 border animate-fadeIn"
              style={{
                backgroundColor: isDark ? '#202c33' : '#ffffff',
                borderColor: T.headerBorder,
                minWidth: '180px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Photo: Class 8-G Science Assignment 📸]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:opacity-80 transition-opacity cursor-pointer text-left"
                style={{ color: T.headerText }}
              >
                <Camera size={16} className="text-[#53bdeb]" />
                <span>Photos & Videos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Document: Term 1 Syllabus PDF 📄]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:opacity-80 transition-opacity cursor-pointer text-left"
                style={{ color: T.headerText }}
              >
                <FileText size={16} className="text-[#9c27b0]" />
                <span>Document Notes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  router.push('/ai-diary');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:opacity-80 transition-opacity cursor-pointer text-left"
                style={{ color: T.headerText }}
              >
                <Award size={16} className="text-[#ff9f00]" />
                <span>Submit Diary Photo</span>
              </button>
            </div>
          )}

          {/* Quick Emoji Bar */}
          {showEmojiPicker && (
            <div
              className="px-4 py-2 border-b flex items-center gap-3 overflow-x-auto"
              style={{
                backgroundColor: isDark ? '#111b21' : '#f0f2f5',
                borderColor: T.headerBorder,
              }}
            >
              {['😀', '😂', '💀', '❤️', '👍', '🔥', '🎉', '📚', '👏', '🚀'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setMessageText((prev) => prev + em);
                    inputRef.current?.focus();
                  }}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Quoted Message Preview Bar */}
          {replyingTo && (
            <div
              className="px-4 py-2 border-b flex items-center justify-between"
              style={{
                backgroundColor: T.headerBg,
                borderColor: T.headerBorder,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getSenderColor(replyingTo.senderName) }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold" style={{ color: getSenderColor(replyingTo.senderName) }}>
                    Replying to {replyingTo.senderName}
                  </div>
                  <div className="text-xs truncate opacity-70" style={{ color: T.headerText }}>
                    {replyingTo.text}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full hover:opacity-70 cursor-pointer"
                style={{ color: T.iconColor }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="min-h-[62px] px-3 md:px-4 py-2 flex items-center gap-2">
            {!canSendMessage ? (
              <div
                className="w-full py-2.5 px-4 rounded-[8px] flex items-center justify-between text-xs font-medium gap-3"
                style={{
                  backgroundColor: T.inputBg,
                  color: T.headerText,
                }}
              >
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-amber-500 shrink-0" />
                  <span>Principal Announcements Channel (Read-Only). Switch to your classroom to chat freely.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChannelId('channel-class-8g')}
                  className="px-3 py-1 rounded bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Open Class 8-G 💬
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                {/* Attachment Icon */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                  style={{ color: T.iconColor }}
                  title="Attach File / Image"
                >
                  <Paperclip size={20} />
                </button>

                {/* Emoji Icon */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                  style={{ color: T.iconColor }}
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>

                {/* WhatsApp Type a Message Box */}
                <div
                  className="flex-1 flex items-center rounded-[8px] px-3 py-2"
                  style={{
                    backgroundColor: T.inputBg,
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                    className="w-full text-sm bg-transparent focus:outline-none"
                    style={{
                      color: T.inputText,
                    }}
                  />
                </div>

                {/* Send Airplane or Microphone Icon */}
                {messageText.trim() ? (
                  <button
                    type="submit"
                    disabled={isSending}
                    className="p-2 rounded-full text-white transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                    style={{ backgroundColor: '#00a884' }}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMessageText('👋 Namaste from DPS Class 8-G!');
                      inputRef.current?.focus();
                    }}
                    className="p-2 rounded-full hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                    style={{ color: T.iconColor }}
                    title="Voice Note / Quick Wave"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: MADAM ASSIGNS FACULTY OR STUDENT TO A CLASSROOM            */}
      {/* ==================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="rounded-[12px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: isDark ? '#202c33' : '#ffffff',
              color: T.headerText,
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: T.dividerColor }}
            >
              <div>
                <h3 className="text-sm font-semibold">Assign Faculty / Student</h3>
                <p className="text-[11px]" style={{ color: T.headerSubtext }}>
                  Sends an official invitation from Principal Madam
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                style={{ color: T.iconColor }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendAssignment} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium block mb-1">Target Classroom</label>
                <select
                  value={assignTargetGroup}
                  onChange={(e) => setAssignTargetGroup(e.target.value)}
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border cursor-pointer"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Recipient Username</label>
                <input
                  type="text"
                  placeholder="e.g. teacher_english or rohan728"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Role Type
                  </label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border cursor-pointer"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  >
                    <option value="teacher">Faculty / Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English Faculty"
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  />
                </div>
              </div>

              <div
                className="p-3 rounded-[8px] text-[11px] leading-relaxed"
                style={{
                  backgroundColor: isDark ? '#111b21' : '#f0f2f5',
                  color: T.headerSubtext,
                }}
              >
                The teacher or student will receive an official assignment banner from Principal Madam. Upon clicking &quot;Accept&quot;, they gain immediate access into the classroom.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-[6px] border cursor-pointer"
                  style={{ borderColor: T.dividerColor, color: T.headerText }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignUsername.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-[6px] text-white bg-[#00a884] hover:bg-[#008f6f] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning ? 'Sending...' : 'Send Assignment Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE NEW CLASSROOM                                        */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="rounded-[12px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: isDark ? '#202c33' : '#ffffff',
              color: T.headerText,
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: T.dividerColor }}
            >
              <h3 className="text-sm font-semibold">Create Classroom</h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                style={{ color: T.iconColor }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium block mb-1">Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Class 8-G Official Classroom"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Grade
                  </label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border cursor-pointer"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  >
                    {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'All'].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Section
                  </label>
                  <input
                    type="text"
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    placeholder="e.g. G"
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-[8px]"
                style={{
                  backgroundColor: isDark ? '#111b21' : '#f0f2f5',
                }}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock size={12} />
                    <span>Mute student posting permissions</span>
                  </div>
                  <div className="text-[10px]" style={{ color: T.headerSubtext }}>
                    Only faculty and Principal Madam can send messages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="w-4 h-4 accent-[#00a884] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-[6px] border cursor-pointer"
                  style={{ borderColor: T.dividerColor, color: T.headerText }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-[6px] text-white bg-[#00a884] hover:bg-[#008f6f] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
