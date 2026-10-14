/**
 * DPS BUZZ DESIGN SYSTEM & COLOR PALETTE
 * 
 * Single source of truth for all design tokens:
 * Brand, light/dark themes, notice categories, and Star Board.
 * Edit any values here to customize the entire app.
 */

export const palette = {
  // Brand Core
  brand: {
    primaryViolet: '#6C47FF',      // Main brand violet (light mode / default)
    primaryVioletDark: '#8C70FF',  // Primary violet for dark mode (enhanced contrast)
    secondaryPink: '#FF4D8D',      // Accent pink
    highlightAmber: '#FFB020',     // Highlight amber (reserved for rewards)
    violetTint: '#EFEBFF',         // Soft violet background tint
  },

  // Brand Gradient: #6C47FF -> #FF4D8D -> #FFB020
  // Reserved for: Story rings, logo text, Star Board accents only
  gradient: {
    from: '#6C47FF',
    via: '#FF4D8D',
    to: '#FFB020',
    css: 'linear-gradient(135deg, #6C47FF 0%, #FF4D8D 50%, #FFB020 100%)',
  },

  // Light Mode Palette
  light: {
    background: '#F7F7FB',
    card: '#FFFFFF',
    border: '#E6E6EF',
    mutedText: '#6B6B80',
    mainText: '#14141F',
    primary: '#6C47FF',
    primaryText: '#FFFFFF',
  },

  // Dark Mode Palette
  dark: {
    background: '#0D0D14',
    card: '#171722',
    border: '#2B2B3B',
    mutedText: '#A3A3B8',
    mainText: '#F4F4F9',
    primary: '#8C70FF',
    primaryText: '#FFFFFF',
  },

  // Notice Categories
  notices: {
    exams: '#2563EB',     // Blue
    holidays: '#16A34A',  // Green
    events: '#FF4D8D',    // Pink
    sports: '#F97316',    // Orange
    fees: '#0891B2',      // Cyan
    urgent: '#DC2626',    // Red (reserved for urgent notices and critical errors)
  },

  // Star Board (Leaderboard medals & rewards)
  starBoard: {
    gold: '#F5B301',
    silver: '#A7B0BE',
    bronze: '#CD7F32',
  },

  // Semantic
  semantic: {
    success: '#16A34A',
    warning: '#FFB020',
    error: '#DC2626',
    info: '#2563EB',
  },
} as const;

export const brand = {
  name: 'DPS Buzz',
  tagline: 'Your School. Your Vibe. 🐝',
  primary: palette.brand.primaryViolet,
  secondary: palette.brand.secondaryPink,
  highlight: palette.brand.highlightAmber,
  gradient: palette.gradient,
} as const;

export const limits = {
  maxPhotosPerPost: 4,
  maxBioLength: 150,
  maxCaptionLength: 500,
  maxCommentLength: 300,
  maxUsernameLength: 20,
  maxImageSizeKB: 150,
  storyDurationHours: 24,
  maxFollowsPerHour: 30,
} as const;
