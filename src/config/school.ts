/**
 * src/config/school.ts — Single source of truth for DPS Buzz School Identity
 * 
 * DESIGN.md Section 2: Identity inputs (placeholders until the real ones arrive)
 * Changing these restyles the entire site.
 */

export const school = {
  // Site & School Name
  siteName: 'DPS Buzz',
  schoolName: 'DPS Buzz',
  shortCode: 'DPS',
  schoolCode: 'DPS71845',

  // Logo / Crest: Text wordmark only, no invented crest
  logo: {
    type: 'wordmark',
    text: 'DPS Buzz',
    subtext: 'Campus Network',
    badge: 'DPS',
  },

  // School Colors (Placeholders until owner supplies real ones)
  colors: {
    primary: '#1E3A8A', // Ink blue
    accent: '#F0563A',  // Coral
  },

  // Houses: None. Removed unless confirmed by owner.
  hasHouses: false,
  houses: null,

  // Motto: None. Do not write one.
  motto: null,

  // Campus photos: None. Use plain placeholders, never stock photos.
  campusPhotos: [],

  classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  classSections: {
    '6': ['A', 'B', 'C', 'D', 'E', 'F'],
    '7': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '8': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '9': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '10': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  },
} as const;

export const CLASS_SECTIONS: Record<string, string[]> = {
  '6': ['A', 'B', 'C', 'D', 'E', 'F'],
  '7': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '8': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '9': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '10': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
};

export function getClassSections(classInput: string | number): string[] {
  const clean = String(classInput).replace(/[^0-9]/g, '');
  return CLASS_SECTIONS[clean] || ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
}

export const schoolConfig = school;
export default school;

