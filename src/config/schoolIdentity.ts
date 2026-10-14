/**
 * SCHOOL IDENTITY CONFIGURATION
 * 
 * Central file for all school identity inputs.
 * Currently populated with PLACEHOLDERS until the school provides official assets.
 * 
 * Rules:
 * - Do NOT assume school facts, houses, or official colors.
 * - Replace placeholder values here once the school provides official guidelines.
 */

export const schoolIdentity = {
  // Official School Name
  name: 'Dilsukhnagar Public School',
  shortName: 'DPS Buzz',
  location: 'Hyderabad',

  // School Motto (PLACEHOLDER: Pending official motto)
  motto: 'Service Before Self', // Placeholder

  // School Crest / Logo (PLACEHOLDER: Text monogram & clean mark, no fabricated animals or shields)
  logo: {
    type: 'placeholder',
    monogram: 'DPS',
    subtext: 'BUZZ',
    svgBadgeText: 'DPS',
  },

  // Color Palette (PLACEHOLDERS: Subject to school brand book)
  colors: {
    // Primary anchor (classic navy placeholder)
    primary: '#1E293B',
    // Accent highlight (warm gold/amber placeholder)
    accent: '#D97706',
    // Neutrals
    backgroundLight: '#F8F9FA',
    backgroundDark: '#0F172A',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1E293B',
    textLight: '#0F172A',
    textDark: '#F8FAFC',
    mutedLight: '#64748B',
    mutedDark: '#94A3B8',
    borderLight: '#E2E8F0',
    borderDark: '#334155',
  },

  // House System
  // NOTE: Set to false. Removed from all UI until school explicitly confirms house names.
  hasHouses: false,
  houses: null as null | Array<{ name: string; color: string; hex: string }>,

  // Academic Divisions (Default Indian Secondary School structure)
  classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  sections: ['A', 'B', 'C', 'D'],

  // Real campus photo slots (PLACEHOLDERS: Clean SVG/gradient architectural frames until real campus photos arrive)
  campusPhotos: {
    courtyard: '/placeholders/campus_courtyard.svg',
    library: '/placeholders/campus_library.svg',
    sportsGround: '/placeholders/campus_ground.svg',
  },
} as const;
