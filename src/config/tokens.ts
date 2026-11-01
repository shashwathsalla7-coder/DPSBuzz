/**
 * src/config/tokens.ts — Unified Design Tokens for DPS Buzz
 * 
 * Strict Single Small Design System:
 * - Neutral cool scale (white page, light grey surfaces, 1px dividers, dark grey text)
 * - Single Blue accent (#2B4BFF) with hover & light tint
 * - 14px card radius, 12px input/button radius, 9999px pill radius
 * - One subtle shadow, no card gradients, no warm backgrounds
 * - Emojis reserved strictly for user captions & reactions
 */

export const colors = {
  light: {
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    sunken: '#F1F5F9',
    line: '#E2E8F0',
    lineStrong: '#CBD5E1',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#2B4BFF',
    primaryHover: '#2139D6',
    primaryTint: '#EFF4FF',
    onPrimary: '#FFFFFF',
    accent: '#2B4BFF',
    accentHover: '#2139D6',
    accentTint: '#EFF4FF',
    accentCta: '#2B4BFF',
    onAccentCta: '#FFFFFF',
    like: '#E5365F',
    danger: '#DC2626',
    gold: '#2B4BFF',
    goldCta: '#2B4BFF',
    onGoldCta: '#FFFFFF',
    silver: '#94A3B8',
    bronze: '#64748B',
    success: '#16A34A',
    warning: '#2B4BFF',
    // Compatibility aliases
    surfaceSunken: '#F1F5F9',
    textMuted: '#64748B',
  },
  dark: {
    bg: '#0B0F17',
    surface: '#111827',
    sunken: '#080C14',
    line: '#1F2937',
    lineStrong: '#374151',
    text: '#F8FAFC',
    muted: '#94A3B8',
    primary: '#4D6BFF',
    primaryHover: '#7088FF',
    primaryTint: '#162038',
    onPrimary: '#FFFFFF',
    accent: '#4D6BFF',
    accentHover: '#7088FF',
    accentTint: '#162038',
    accentCta: '#4D6BFF',
    onAccentCta: '#FFFFFF',
    like: '#FF5C85',
    danger: '#EF4444',
    gold: '#4D6BFF',
    goldCta: '#4D6BFF',
    onGoldCta: '#FFFFFF',
    silver: '#64748B',
    bronze: '#94A3B8',
    success: '#22C55E',
    warning: '#4D6BFF',
    // Compatibility aliases
    surfaceSunken: '#080C14',
    textMuted: '#94A3B8',
  },
  notices: {
    exams: { light: '#2B4BFF', dark: '#4D6BFF' },
    holidays: { light: '#16A34A', dark: '#22C55E' },
    events: { light: '#2B4BFF', dark: '#4D6BFF' },
    sports: { light: '#2B4BFF', dark: '#4D6BFF' },
    fees: { light: '#2B4BFF', dark: '#4D6BFF' },
    urgent: { light: '#DC2626', dark: '#EF4444' },
  },
  // Neutral initials avatar fallbacks (cool slate pairs)
  avatars: [
    { bg: '#E2E8F0', text: '#1E293B' },
    { bg: '#CBD5E1', text: '#0F172A' },
    { bg: '#DBEAFE', text: '#1D4ED8' },
    { bg: '#E0E7FF', text: '#3730A3' },
    { bg: '#E2E8F0', text: '#334155' },
    { bg: '#F1F5F9', text: '#1E293B' },
    { bg: '#EFF6FF', text: '#1E40AF' },
    { bg: '#F8FAFC', text: '#0F172A' },
  ],
} as const;

export const typography = {
  fonts: {
    display: "'Satoshi', system-ui, -apple-system, sans-serif",
    body: "'Satoshi', system-ui, -apple-system, sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  scale: {
    display: { size: '24px', lineHeight: '30px', weight: 600 },
    heading: { size: '20px', lineHeight: '26px', weight: 600 },
    title: { size: '16px', lineHeight: '22px', weight: 600 },
    body: { size: '14px', lineHeight: '20px', weight: 400 },
    meta: { size: '12px', lineHeight: '16px', weight: 500 },
  },
} as const;

export const spacing = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  24: '24px',
  32: '32px',
} as const;

export const radii = {
  card: '14px',
  input: '12px',
  btn: '12px',
  pill: '9999px',
  circle: '9999px',
  // Compatibility aliases
  photo: '14px',
  hero: '14px',
  grid: '14px',
  tabbar: '0px', // full-width docked bar
  sheet: '16px',
  groupAvatar: '12px',
  chatBubble: '14px',
  notice: '14px',
  xs: '6px',
  sm: '12px',
  md: '14px',
  lg: '14px',
  bubble: '14px',
  full: '9999px',
} as const;

export const shadows = {
  subtle: '0 1px 3px rgba(15, 23, 42, 0.05)',
  tabbar: '0 -1px 0 rgba(226, 232, 240, 0.8)',
  none: 'none',
  // Compatibility aliases
  tabbarLight: '0 -1px 0 #E2E8F0',
  tabbarDark: '0 -1px 0 #1F2937',
  elev1Light: '0 1px 3px rgba(15, 23, 42, 0.05)',
  elev1Dark: '0 1px 3px rgba(0, 0, 0, 0.3)',
  stickerLight: 'none',
  stickerDark: 'none',
} as const;

export const motion = {
  durFast: '120ms',
  durBase: '180ms',
  durSlow: '240ms',
  easeOut: 'cubic-bezier(.2,.8,.2,1)',
  easeSpring: 'cubic-bezier(.34,1.56,.64,1)',
} as const;

/**
 * Deterministically pick an avatar color pair from curated neutral pairs based on username
 */
export function getAvatarColorPair(username: string, isDark = false) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colors.avatars.length;
  const pair = colors.avatars[index];

  if (isDark) {
    return {
      bg: '#1F2937',
      text: '#F8FAFC',
    };
  }
  return pair;
}

/**
 * Story Ring specifications (Neon gradient preserved strictly per user rule)
 * - Orange, pink, purple, blue and white
 */
export const storyTokens = {
  unseenGradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%)',
  seenLight: '#CBD5E1',
  seenDark: '#475569',
  darkGlow: 'none',
  outerSize: '60px',
  ringThickness: '2.5px',
  innerRingThickness: '2px',
  plusBadgeSize: '20px',
  plusBadgeBorder: '2px solid #FFFFFF',
} as const;

export interface TextStoryPreset {
  id: string;
  name: string;
  background: string;
  textColor: string;
  isGradient: boolean;
}

export const textStoryPresets: TextStoryPreset[] = [
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    background: '#1E3A8A',
    textColor: '#FFFFFF',
    isGradient: false,
  },
  {
    id: 'cool-slate',
    name: 'Cool Slate',
    background: '#0F172A',
    textColor: '#FFFFFF',
    isGradient: false,
  },
  {
    id: 'brand-blue',
    name: 'DPS Blue',
    background: '#2B4BFF',
    textColor: '#FFFFFF',
    isGradient: false,
  },
  {
    id: 'neon-story',
    name: 'Story Glow',
    background: 'linear-gradient(135deg, #FF8A1F 0%, #FF2E93 50%, #3B82F6 100%)',
    textColor: '#FFFFFF',
    isGradient: true,
  },
];
