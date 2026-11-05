// WhatsApp Desktop Replica – Design Tokens & Constants
// Clean-room tokens matching WhatsApp Desktop Windows dark theme

export const COLORS = {
  // Base surfaces
  baseDark: '#0b141a',
  sidebar: '#111b21',
  header: '#202c33',
  inputBg: '#2a3942',
  hoverBg: '#2a3942',
  activeBg: '#2a3942',
  divider: '#222d34',

  // Bubble colors
  outgoing: '#005c4b',
  incoming: '#202c33',
  outgoingHover: '#025144',

  // Text
  textPrimary: '#e9edef',
  textSecondary: '#8696a0',
  textMuted: '#667781',

  // Accent
  primary: '#00a884',
  primaryHover: '#008f6f',
  blueCheck: '#53bdeb',
  danger: '#ea4335',
  linkBlue: '#53bdeb',

  // Sender colors (WhatsApp Desktop group chat colors)
  senderColors: [
    '#53bdeb', '#f15c6d', '#e542a3', '#ff9f00', '#25d366',
    '#7c5ce0', '#00bcd4', '#ff5722', '#009688', '#e91e63',
  ],

  // Status ring
  statusRing: '#00a884',
  statusViewed: '#8696a0',

  // Call colors
  callGreen: '#00a884',
  callRed: '#ea4335',
  callMissed: '#ea4335',
};

export const FONTS = {
  family: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
};

// WhatsApp Desktop doodle wallpaper SVG
export const WHATSAPP_DOODLE_DARK = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='440' height='440' viewBox='0 0 440 440' fill='none' stroke='%23ffffff' stroke-opacity='0.055' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M35 25 h38 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-22 l-14 10 v-10 h-2 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z'/><circle cx='54' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='64' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='74' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><path d='M150 32 h30 v26 a14 14 0 0 1 -14 14 h-2 a14 14 0 0 1 -14 -14 v-26 z'/><path d='M180 38 h8 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-8'/><path d='M158 24 c0 -5 4 -5 4 -10'/><path d='M168 24 c0 -5 4 -5 4 -10'/><rect x='260' y='28' width='52' height='32' rx='12'/><path d='M272 38 v12 M266 44 h12'/><circle cx='298' cy='40' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='304' cy='48' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M370 50 a22 22 0 0 1 44 0 v14'/><rect x='365' y='56' width='9' height='16' rx='3'/><rect x='410' y='56' width='9' height='16' rx='3'/><circle cx='60' cy='155' r='18'/><polygon points='60,145 68,151 65,160 55,160 52,151'/><line x1='60' y1='145' x2='60' y2='137'/><line x1='68' y1='151' x2='76' y2='148'/><line x1='65' y1='160' x2='71' y2='168'/><line x1='55' y1='160' x2='49' y2='168'/><line x1='52' y1='151' x2='44' y2='148'/><path d='M155 135 l32 10 l-20 32 z'/><path d='M155 135 a36 36 0 0 1 32 10'/><circle cx='165' cy='150' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='170' cy='164' r='2' fill='%23ffffff' fill-opacity='0.055'/><rect x='260' y='140' width='42' height='30' rx='5'/><path d='M272 140 l3 -5 h12 l3 5'/><circle cx='281' cy='155' r='8'/><circle cx='294' cy='146' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='368' cy='160' r='12'/><circle cx='404' cy='160' r='12'/><path d='M368 160 l16 -18 h12 l7 18 M384 142 l-9 -14 h12 M396 142 l-12 18'/><path d='M42 250 l44 -18 l-22 40 l-7 -13 l-15 -9 z'/><path d='M86 232 l-29 27'/><path d='M150 260 a12 12 0 0 1 20 -8 a16 16 0 0 1 26 5 a10 10 0 0 1 4 18 h-48 a7 7 0 0 1 -2 -15 z'/><polygon points='172,274 166,283 173,283 169,291 180,281 173,281' fill='%23ffffff' fill-opacity='0.055'/><circle cx='272' cy='255' r='16'/><path d='M272 245 v10 l7 5'/><path d='M258 240 l-5 -5 M286 240 l5 -5'/><path d='M365 242 a16 16 0 0 1 26 16 c-3 4 -4 7 -4 12 h-18 c0 -5 -1 -8 -4 -12 a16 16 0 0 1 0 -16 z'/><line x1='374' y1='275' x2='382' y2='275'/><circle cx='50' cy='365' r='4' fill='%23ffffff' fill-opacity='0.055'/><circle cx='68' cy='358' r='4' fill='%23ffffff' fill-opacity='0.055'/><path d='M54 365 v-20 l18 -7 v20 M54 345 l18 -7'/><path d='M165 340 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z' fill='%23ffffff' fill-opacity='0.055'/><circle cx='192' cy='348' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M250 375 c0 -14 10 -24 19 -30 c9 5 19 16 19 30 h-38 z'/><circle cx='269' cy='360' r='3.5'/><path d='M250 375 l-8 7 v-10 l8 -7 M288 375 l8 7 v-10 l-8 -7'/><path d='M352 348 a6 6 0 0 0 -9 9 l9 9 l9 -9 a6 6 0 0 0 -9 -9 z'/><circle cx='388' cy='360' r='12'/><circle cx='384' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='392' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><path d='M384 364 a5 5 0 0 0 8 0'/><polygon points='105,32 126,22 147,32 126,42'/><path d='M113 37 v8 c0 5 13 8 13 8 s13 -3 13 -8 v-8'/><path d='M205 95 h44 M205 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0 M227 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0'/><path d='M305 92 h20 v8 a10 10 0 0 1 -20 0 z M315 100 v10 M308 110 h14'/><path d='M98 195 l18 -18 l5 5 l-18 18 l-5 2 z'/><path d='M205 200 v17 M212 200 v17 M201 205 h17 M201 212 h17'/></svg>`;

// Demo data
export const DEMO_CONTACTS: import('./types').ContactItem[] = [
  { id: 'c1', name: 'Himaksh', phone: '+91 93476 06076', about: 'Available', avatarColor: '#53bdeb', initials: 'HM', isOnline: true },
  { id: 'c2', name: 'Rishikesh', phone: '+91 63004 76366', about: 'At school', avatarColor: '#f15c6d', initials: 'RK', lastSeen: '5 min ago' },
  { id: 'c3', name: 'Rohan', phone: '+91 98765 43210', about: 'DPS student', avatarColor: '#53bdeb', initials: 'RN', lastSeen: '8:21 pm' },
  { id: 'c4', name: 'Krishna', phone: '+91 87654 32109', about: 'Available on DPS Buzz', avatarColor: '#e542a3', initials: 'KR', lastSeen: 'Yesterday' },
  { id: 'c5', name: 'Ak 47', phone: '+91 76543 21098', about: 'Cricket Team', avatarColor: '#ff9f00', initials: 'AK', lastSeen: '7:15 pm' },
  { id: 'c6', name: 'Anita Madam', phone: '+91 99887 76655', about: 'English Faculty | DPS', avatarColor: '#e542a3', initials: 'AM', lastSeen: '10 min ago' },
  { id: 'c7', name: 'Sri', phone: '+91 98001 23456', about: 'DPS Buzz Admin', avatarColor: '#25d366', initials: 'SR', isOnline: true },
  { id: 'c8', name: 'Rishi Sunak', phone: '+91 88776 65544', about: '11th Science', avatarColor: '#7c5ce0', initials: 'RS', lastSeen: '2 hours ago' },
  { id: 'c9', name: 'Priya', phone: '+91 77665 54433', about: 'Art Club President', avatarColor: '#00bcd4', initials: 'PR', isOnline: true },
  { id: 'c10', name: 'Vikas Sir', phone: '+91 99112 23344', about: 'Mathematics Faculty', avatarColor: '#ff5722', initials: 'VS', lastSeen: '1 hour ago' },
];

export const DEMO_STATUSES: import('./types').StatusItem[] = [
  {
    id: 'st1', contactName: 'My Status', contactColor: '#00a884', contactInitials: 'S', time: 'Tap to add status update', viewed: true,
    updates: [],
  },
  {
    id: 'st2', contactName: 'Himaksh', contactColor: '#53bdeb', contactInitials: 'HM', time: '25 minutes ago', viewed: false,
    updates: [{ id: 'su1', type: 'text', content: 'Exam prep in progress', backgroundColor: '#005c4b', time: '25 minutes ago', viewCount: 12 }],
  },
  {
    id: 'st3', contactName: 'Rohan', contactColor: '#53bdeb', contactInitials: 'RN', time: '1 hour ago', viewed: false,
    updates: [{ id: 'su2', type: 'text', content: 'Preparing for physics practicals', backgroundColor: '#0b141a', time: '1 hour ago', viewCount: 8 }],
  },
  {
    id: 'st4', contactName: 'Priya', contactColor: '#00bcd4', contactInitials: 'PR', time: '3 hours ago', viewed: true,
    updates: [{ id: 'su3', type: 'text', content: 'Art exhibition tomorrow at school gallery', backgroundColor: '#7c5ce0', time: '3 hours ago', viewCount: 45 }],
  },
  {
    id: 'st5', contactName: 'Krishna', contactColor: '#e542a3', contactInitials: 'KR', time: '5 hours ago', viewed: true,
    updates: [{ id: 'su4', type: 'text', content: 'Holiday homework reminder', backgroundColor: '#ff5722', time: '5 hours ago', viewCount: 22 }],
  },
];

export const DEMO_CALLS: import('./types').CallItem[] = [
  { id: 'cl1', contactName: 'Himaksh', contactColor: '#53bdeb', contactInitials: 'HM', time: 'Today, 6:30 pm', type: 'video', direction: 'outgoing', duration: '12:45' },
  { id: 'cl2', contactName: 'Together Forever', contactColor: '#53bdeb', contactInitials: 'TF', time: 'Today, 5:15 pm', type: 'voice', direction: 'incoming', duration: '3:22', isGroup: true },
  { id: 'cl3', contactName: 'Rohan', contactColor: '#53bdeb', contactInitials: 'RN', time: 'Today, 2:00 pm', type: 'voice', direction: 'missed' },
  { id: 'cl4', contactName: 'Anita Madam', contactColor: '#e542a3', contactInitials: 'AM', time: 'Yesterday, 4:30 pm', type: 'voice', direction: 'incoming', duration: '5:10' },
  { id: 'cl5', contactName: 'Krishna', contactColor: '#e542a3', contactInitials: 'KR', time: 'Yesterday, 1:20 pm', type: 'video', direction: 'outgoing', duration: '8:33' },
  { id: 'cl6', contactName: 'Class 8-G Official Classroom', contactColor: '#25d366', contactInitials: '8G', time: 'Nov 3, 10:00 am', type: 'video', direction: 'incoming', duration: '45:00', isGroup: true },
  { id: 'cl7', contactName: 'Vikas Sir', contactColor: '#ff5722', contactInitials: 'VS', time: 'Nov 2, 3:15 pm', type: 'voice', direction: 'missed' },
  { id: 'cl8', contactName: 'Sri', contactColor: '#25d366', contactInitials: 'SR', time: 'Nov 1, 7:00 pm', type: 'video', direction: 'outgoing', duration: '15:20' },
];

export const DEMO_COMMUNITIES: import('./types').CommunityItem[] = [
  { id: 'com1', name: 'DPS School Community', description: 'Official school-wide community for all DPS students, faculty, and parents', avatarColor: '#00a884', initials: 'DPS', memberCount: 5500, groups: ['Principal Dispatches', 'Events & Activities', 'Parent-Teacher Forum', 'Lost & Found'] },
  { id: 'com2', name: 'Class 8 Batch 2026', description: 'All sections of Class 8 — academic discussions, events, and coordination', avatarColor: '#7c5ce0', initials: '8', memberCount: 240, groups: ['8-A Classroom', '8-B Classroom', '8-C Classroom', '8-G Official Classroom', 'Class 8 Sports', 'Class 8 Cultural'] },
  { id: 'com3', name: 'Science & Tech Club', description: 'Robotics, coding, science fairs, and innovation projects', avatarColor: '#ff9f00', initials: 'ST', memberCount: 120, groups: ['Robotics Team', 'Coding Club', 'Science Fair 2026', 'Tech Talks'] },
];
