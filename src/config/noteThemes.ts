export interface NoteColorTheme {
  id: string;
  name: string;
  gradient: string;
  border: string;
  textColor: string;
  bubbleShadow: string;
  glow: string;
  accent: string;
}

export const MIXED_NOTE_COLORS: NoteColorTheme[] = [
  {
    id: 'classic',
    name: 'Instagram Dark',
    gradient: 'linear-gradient(135deg, #262626 0%, #1c1c1e 100%)',
    border: 'rgba(255, 255, 255, 0.16)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
    glow: 'rgba(255, 255, 255, 0.15)',
    accent: '#262626',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
    border: 'rgba(236, 72, 153, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
    glow: 'rgba(236, 72, 153, 0.4)',
    accent: '#F59E0B',
  },
  {
    id: 'aurora',
    name: 'Cosmic Aurora',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
    border: 'rgba(124, 58, 237, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
    glow: 'rgba(6, 182, 212, 0.4)',
    accent: '#06B6D4',
  },
  {
    id: 'candy',
    name: 'Cotton Candy',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #D946EF 50%, #38BDF8 100%)',
    border: 'rgba(217, 70, 239, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(217, 70, 239, 0.4)',
    glow: 'rgba(244, 63, 94, 0.4)',
    accent: '#38BDF8',
  },
  {
    id: 'tropical',
    name: 'Neon Tropical',
    gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 50%, #3B82F6 100%)',
    border: 'rgba(6, 182, 212, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
    glow: 'rgba(16, 185, 129, 0.4)',
    accent: '#10B981',
  },
  {
    id: 'golden',
    name: 'Golden Sunrise',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #E11D48 100%)',
    border: 'rgba(249, 115, 22, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
    glow: 'rgba(245, 158, 11, 0.4)',
    accent: '#E11D48',
  },
  {
    id: 'berry',
    name: 'Electric Berry',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 50%, #FB7185 100%)',
    border: 'rgba(192, 38, 211, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(192, 38, 211, 0.4)',
    glow: 'rgba(251, 113, 133, 0.4)',
    accent: '#FB7185',
  },
  {
    id: 'ocean',
    name: 'Ocean Wave',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 50%, #4F46E5 100%)',
    border: 'rgba(37, 99, 235, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
    glow: 'rgba(6, 182, 212, 0.4)',
    accent: '#38BDF8',
  },
  {
    id: 'cyber',
    name: 'Cyber Mint',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #84CC16 50%, #10B981 100%)',
    border: 'rgba(20, 184, 166, 0.65)',
    textColor: '#FFFFFF',
    bubbleShadow: '0 4px 20px rgba(20, 184, 166, 0.4)',
    glow: 'rgba(132, 204, 22, 0.4)',
    accent: '#84CC16',
  },
];

export function getNoteColorTheme(themeId?: string, usernameSeed?: string): NoteColorTheme {
  if (themeId) {
    const found = MIXED_NOTE_COLORS.find((c) => c.id === themeId);
    if (found) return found;
  }
  if (usernameSeed) {
    let hash = 0;
    for (let i = 0; i < usernameSeed.length; i++) {
      hash = usernameSeed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % MIXED_NOTE_COLORS.length;
    return MIXED_NOTE_COLORS[idx];
  }
  return MIXED_NOTE_COLORS[0];
}
