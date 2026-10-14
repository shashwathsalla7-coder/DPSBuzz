/**
 * src/config/tokens.ts — Design Tokens for DPS Buzz
 * 
 * Strict implementation of DESIGN.md Sections 4, 5, 6, 7, 8.
 * Single source of truth for colors, typography, spacing, radii, elevation and motion.
 */

export const colors = {
  light: {
    bg: '#F6F8FB',
    surface: '#FFFFFF',
    sunken: '#EDF0F5',
    line: '#DFE4EC',
    lineStrong: '#C4CCD8',
    text: '#121620',
    muted: '#596275',
    primary: '#2B4BFF',
    primaryHover: '#2139D6',
    primaryTint: '#E8EDFF',
    onPrimary: '#FFFFFF',
    accent: '#0B9DB0',
    accentHover: '#088495',
    accentTint: '#E0F6F9',
    accentCta: '#2B4BFF',
    onAccentCta: '#FFFFFF',
    like: '#E5365F',
    danger: '#C62828',
    gold: '#0B9DB0',
    goldCta: '#2B4BFF',
    onGoldCta: '#FFFFFF',
    silver: '#C4CCD8',
    bronze: '#596275',
    success: '#15803D',
    warning: '#0B9DB0',
    // Compatibility aliases
    surfaceSunken: '#EDF0F5',
    textMuted: '#596275',
  },
  dark: {
    bg: '#0F131B',
    surface: '#171C26',
    sunken: '#0B0E14',
    line: '#262D3B',
    lineStrong: '#3A4357',
    text: '#EEF1F6',
    muted: '#98A2B6',
    primary: '#7C9BFF',
    primaryHover: '#9DB4FF',
    primaryTint: '#1B2548',
    onPrimary: '#0E1530',
    accent: '#3CC8DA',
    accentHover: '#62D6E6',
    accentTint: '#0E2830',
    accentCta: '#7C9BFF',
    onAccentCta: '#0E1530',
    like: '#FF5C85',
    danger: '#FF6B6B',
    gold: '#3CC8DA',
    goldCta: '#7C9BFF',
    onGoldCta: '#0E1530',
    silver: '#3A4357',
    bronze: '#98A2B6',
    success: '#22C55E',
    warning: '#3CC8DA',
    // Compatibility aliases
    surfaceSunken: '#0B0E14',
    textMuted: '#98A2B6',
  },
  notices: {
    exams: { light: '#2B4BFF', dark: '#7C9BFF' },
    holidays: { light: '#15803D', dark: '#4CC38A' },
    events: { light: '#0B9DB0', dark: '#3CC8DA' },
    sports: { light: '#2B4BFF', dark: '#7C9BFF' },
    fees: { light: '#0B7285', dark: '#3CC8DA' },
    urgent: { light: '#C62828', dark: '#FF6B6B' },
  },
  // 8 Curated Avatar Pairs (Section 7)
  avatars: [
    { bg: '#FFD9CC', text: '#7A2E1B' },
    { bg: '#FDEBA8', text: '#6B5200' },
    { bg: '#CFEBD8', text: '#14532D' },
    { bg: '#CDE6F7', text: '#0C4A6E' },
    { bg: '#E2D9FB', text: '#3B2A87' },
    { bg: '#FBD3E3', text: '#8A1C4B' },
    { bg: '#D6E4C8', text: '#3F5B1E' },
    { bg: '#F3D9C4', text: '#6B3A12' },
  ],
} as const;

export const typography = {
  fonts: {
    display: "'Cabinet Grotesk', -apple-system, sans-serif",
    body: "'Satoshi', system-ui, -apple-system, sans-serif",
    hand: "'Kalam', cursive",
    mono: "'IBM Plex Mono', monospace",
    optionalNotice: "'Gambetta', serif",
  },
  scale: {
    displayXl: { size: '40px', lineHeight: '44px', weight: 800, letterSpacing: '-0.02em' },
    displayL: { size: '28px', lineHeight: '32px', weight: 700, letterSpacing: '-0.02em' },
    title: { size: '22px', lineHeight: '26px', weight: 700, letterSpacing: '-0.02em' },
    heading: { size: '18px', lineHeight: '22px', weight: 600, letterSpacing: '-0.02em' },
    bodyL: { size: '16px', lineHeight: '24px', weight: 400 },
    body: { size: '16px', lineHeight: '24px', weight: 400 },
    label: { size: '14px', lineHeight: '16px', weight: 600 },
    meta: { size: '12px', lineHeight: '16px', weight: 500 },
    hand: { size: '18px', lineHeight: '24px', weight: 400 },
  },
} as const;

export const spacing = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  32: '32px',
  40: '40px',
  56: '56px',
  72: '72px',
} as const;

export const radii = {
  pill: '9999px',          // chips and search fields full pill
  btn: '14px',             // buttons and inputs 14
  input: '14px',
  photo: '20px',           // photo cards and hero card 20
  hero: '20px',
  grid: '16px',            // grid cards 16
  tabbar: '24px',          // floating tab bar 24
  sheet: '24px',           // bottom sheets 24 (top only)
  groupAvatar: '14px',     // group avatars 14
  chatBubble: '18px',      // chat bubbles 18
  notice: '6px',           // notice cards 6
  circle: '9999px',        // people avatars and story rings full circle
  // Compatibility aliases
  xs: '6px',
  sm: '9999px',
  md: '14px',
  lg: '20px',
  bubble: '18px',
  full: '9999px',
} as const;

export const shadows = {
  tabbarLight: '0 8px 24px rgba(18,22,32,0.12)',
  tabbarDark: '0 8px 24px rgba(0,0,0,0.5)',
  elev1Light: '0 6px 20px rgba(18,22,32,0.08)',
  elev1Dark: '0 6px 20px rgba(0,0,0,0.45)',
  stickerLight: '2px 2px 0 #121620',
  stickerDark: '2px 2px 0 #000000',
} as const;

export const motion = {
  durFast: '120ms',
  durBase: '180ms',
  durSlow: '280ms',
  easeOut: 'cubic-bezier(.2,.8,.2,1)',
  easeSpring: 'cubic-bezier(.34,1.56,.64,1)',
} as const;

/**
 * Deterministically pick an avatar color pair from 8 curated pairs based on username
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
    // In dark mode: background = letter color at 22% over surface, text = light background color
    return {
      bg: `${pair.text}38`,
      text: pair.bg,
    };
  }
  return pair;
}

/**
 * Story Ring specifications (Master Prompt Quality Pass Override)
 * - Warm orange is allowed ONLY in story rings and text-story backgrounds.
 * - Unseen ring: 62px outer, 3px gradient (orange, pink, purple, blue; no yellow), 2px white inner ring in light & dark.
 * - Dark mode only: 0 0 10px rgba(255,70,150,.45) glow on unseen.
 * - Seen ring: flat #C4CCD8 (light), #3A4357 (dark). Inner ring is page color in dark mode.
 * - Your story: dashed ring in line-strong, 20px primary plus badge with 2px white border.
 * - New story: 1s pulse (scale 1 > 1.04 > 1).
 */
export const storyTokens = {
  unseenGradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%)',
  seenLight: '#C4CCD8',
  seenDark: '#3A4357',
  darkGlow: '0 0 10px rgba(255, 70, 150, 0.45)',
  outerSize: '62px',
  ringThickness: '3px',
  innerRingThickness: '2px',
  plusBadgeSize: '20px',
  plusBadgeBorder: '2px solid #FFFFFF',
} as const;

/**
 * 6 Text story preset backgrounds for story creator (text at least 28px)
 */
export interface TextStoryPreset {
  id: string;
  name: string;
  background: string;
  textColor: string;
  isGradient: boolean;
}

export const textStoryPresets: TextStoryPreset[] = [
  {
    id: 'orange-pink',
    name: 'Orange to Pink',
    background: 'linear-gradient(135deg, #FF5A1F 0%, #E0207F 100%)',
    textColor: '#FFFFFF',
    isGradient: true,
  },
  {
    id: 'pink-violet',
    name: 'Hot Pink to Violet',
    background: 'linear-gradient(135deg, #FF2E93 0%, #7C3AED 100%)',
    textColor: '#FFFFFF',
    isGradient: true,
  },
  {
    id: 'blue-violet',
    name: 'Blue to Violet',
    background: 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
    textColor: '#FFFFFF',
    isGradient: true,
  },
  {
    id: 'cyan',
    name: 'Cyan',
    background: '#22D3EE',
    textColor: '#06121F',
    isGradient: false,
  },
  {
    id: 'near-black',
    name: 'Near Black',
    background: '#0B0F1A',
    textColor: '#FFFFFF',
    isGradient: false,
  },
  {
    id: 'white',
    name: 'White',
    background: '#FFFFFF',
    textColor: '#121620',
    isGradient: false,
  },
];

