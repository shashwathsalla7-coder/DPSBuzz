// ============================================================================
// DPS BUZZ - Nursery to Class 10 School System Core
// Full Cloud Database Backed (Cloudflare D1 SQL + Supabase Persistence)
// Powers:
// 1. Madam's Broadcast Desk (Direct Principal to Student/Parent messaging)
// 2. Class Groups (Nursery to Class 10 with Junior Parent-Teacher privacy)
// 3. Study Corner (Collaborative Notes & Revision Sheets)
// 4. Daily Question Box (AI Ranked Question Algorithm & Spirit Points)
// 5. AI Diary & Intelligent Study Scheduler
// ============================================================================

import { DataStore } from './dataStore';

export interface PrincipalBroadcast {
  id: string;
  title: string;
  message: string;
  sender: string;
  senderRole: string;
  senderAvatar: string;
  targetAudience: 'all' | 'nursery_5' | 'seniors_6_10' | 'teachers';
  targetAudienceLabel: string;
  date: string;
  priority: 'urgent' | 'high' | 'normal';
  acknowledgedBy: string[];
}

export interface OfficialClassGroup {
  id: string;
  name: string;
  grade: string;
  section: string;
  title: string;
  tier: 'junior' | 'primary' | 'middle' | 'senior';
  isJuniorPrivate: boolean;
  description: string;
  memberCount: number;
  classTeacher: string;
  color: string;
  emoji: string;
  rules: string[];
  homework: {
    subject: string;
    task: string;
    dueDate: string;
  }[];
}

export interface StudyNoteItem {
  id: string;
  title: string;
  subject: string;
  classGrade: string;
  description: string;
  authorName: string;
  authorUsername?: string;
  authorRole: 'student' | 'teacher' | 'club';
  authorClass?: string;
  likes: number;
  likedBy: string[];
  downloads: number;
  fileType: 'pdf' | 'summary' | 'cheat_sheet' | 'notes' | 'image';
  badge?: string;
  createdAt: string;
  contentPreview: string;
  imageUrl?: string;
}

export interface DailyQuizQuestion {
  id: string;
  dateStr?: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  funFact: string;
  authorUsername?: string;
  authorName?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  aiRankScore?: number;
  status?: string;
  scheduledDate?: string;
}

export interface UserQuizProgress {
  answeredDates: Record<string, { questionId?: string; selectedIndex: number; isCorrect: boolean; timestamp: number }>;
  currentStreak: number;
  totalPointsWon: number;
}

export interface StudyScheduleItem {
  id: string;
  timeBlock: string;
  subject: string;
  task: string;
  priority: 'urgent' | 'high' | 'normal';
  durationMin: number;
  done: boolean;
}

export interface DailyStudySchedule {
  id: string;
  dateStr: string;
  grade: string;
  totalDurationMin: number;
  items: StudyScheduleItem[];
}

export interface ClassDiaryEntry {
  id: string;
  classGrade: string;
  section: string;
  dateStr: string;
  imageUrl: string;
  homeworkSummary: string;
  uploadedByUsername: string;
  uploadedByName: string;
  isFirstSubmission: boolean;
  pointsAwarded: number;
  createdAt: string;
}

export interface CampusWireChannel {
  id: string;
  name: string;
  grade: string;
  section: string;
  avatar?: string;
  isLocked: boolean;
  adminUsernames: string[];
  enrolledUsernames?: string[];
  memberCount: number;
  lastMessage: string;
  lastMessageTime: string;
  createdAt?: string;
}

export interface CampusWireMessage {
  id: string;
  channelId: string;
  senderUsername: string;
  senderName: string;
  senderRole: 'admin' | 'teacher' | 'student';
  senderClass?: string;
  text: string;
  templateType?: 'none' | 'attendance' | 'homework' | 'exam';
  timestamp: number;
  createdAt?: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'image' | 'audio' | 'document';
  mediaDuration?: string;
  reactions?: Record<string, number>;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviteeUsername: string;
  inviteeRole: 'teacher' | 'student' | 'admin';
  subject?: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
}

export interface RosterStudent {
  name: string;
  classSection: string;
  parentKey: string;
  enrollmentId: string;
  mappedRoomId: string;
}

export interface LostFoundItem {
  id: string;
  title: string;
  category: string;
  status: 'LOST' | 'FOUND' | 'CLAIMED';
  location: string;
  specificSpot: string;
  description: string;
  imageUrl?: string;
  reporterUsername: string;
  reporterName: string;
  reporterClass: string;
  reporterSection: string;
  reporterRole?: string;
  finderUsername?: string;
  finderName?: string;
  finderClass?: string;
  finderSection?: string;
  finderNotes?: string;
  storageLocation: string;
  urgent: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

// ----------------------------------------------------------------------------
// OFFICIAL CLASS GROUPS (Curriculum Standard Nursery to Class 10)
// ----------------------------------------------------------------------------

export const OFFICIAL_CLASS_GROUPS: OfficialClassGroup[] = [
  {
    id: 'class-nursery',
    name: 'Nursery - Little Blossoms',
    grade: 'Nursery',
    section: 'A & B',
    title: 'Nursery Parent-Teacher Circle 🌸',
    tier: 'junior',
    isJuniorPrivate: true,
    description: 'Strictly private parent-teacher circle for Nursery students. Daily activities, craft photos, and teacher notes.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#EC4899',
    emoji: '🌸',
    rules: [
      'Only verified parents and class teachers can view photos.',
      'No sharing of student photos outside the app.',
      'Direct messaging with class teacher active 9:00 AM – 3:00 PM.',
    ],
    homework: [],
  },
  {
    id: 'class-lkg',
    name: 'LKG - Little Sprouts',
    grade: 'LKG',
    section: 'A & B',
    title: 'LKG Parent-Teacher Circle 🌱',
    tier: 'junior',
    isJuniorPrivate: true,
    description: 'Foundation year activities, phonics practice, and teacher dispatches.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#10B981',
    emoji: '🌱',
    rules: ['Private parent community', 'Homework diary updated daily at 2:00 PM'],
    homework: [],
  },
  {
    id: 'class-ukg',
    name: 'UKG - Rising Stars',
    grade: 'UKG',
    section: 'A & B',
    title: 'UKG Parent-Teacher Circle ⭐',
    tier: 'junior',
    isJuniorPrivate: true,
    description: 'Pre-primary graduation preparation, early reading, and counting.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#F59E0B',
    emoji: '⭐',
    rules: ['Private parent circle', 'Teacher office hours: 2:00 PM – 4:00 PM'],
    homework: [],
  },
  {
    id: 'class-1',
    name: 'Class 1 - Explorers',
    grade: '1',
    section: 'A',
    title: 'Class 1-A Primary Circle 🚀',
    tier: 'primary',
    isJuniorPrivate: true,
    description: 'Primary school foundation circle for Class 1 students and parents.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#3B82F6',
    emoji: '🚀',
    rules: ['Safe classroom space', 'Parents can monitor student spirit points'],
    homework: [],
  },
  {
    id: 'class-5',
    name: 'Class 5 - Innovators',
    grade: '5',
    section: 'A',
    title: 'Class 5-A Junior Leaders 💡',
    tier: 'primary',
    isJuniorPrivate: true,
    description: 'Upper primary cohort: Science experiments, mathematics problem solving.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#8B5CF6',
    emoji: '💡',
    rules: ['Classroom discussion and project collaboration'],
    homework: [],
  },
  {
    id: 'class-8-a',
    name: 'Class 8-A Leaders',
    grade: '8',
    section: 'A',
    title: 'Class 8-A Official Cohort 🏆',
    tier: 'middle',
    isJuniorPrivate: false,
    description: 'Official class community for Class 8-A students and teachers. Homework, project groups, and quiz leaderboards.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#0284C7',
    emoji: '🏆',
    rules: [
      'Maintain respectful, polite academic discussions.',
      'Share helpful notes and clarify homework doubts.',
      'No spamming or off-topic memes during class hours.',
    ],
    homework: [],
  },
  {
    id: 'class-8-g',
    name: 'Class 8-G Achievers',
    grade: '8',
    section: 'G',
    title: 'Class 8-G Official Cohort 🎯',
    tier: 'middle',
    isJuniorPrivate: false,
    description: 'Class 8-G student discussion, homework tracker, and study corner sync.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#0D9488',
    emoji: '🎯',
    rules: ['Official class room', 'Homework updates posted daily by 3:30 PM'],
    homework: [],
  },
  {
    id: 'class-10-a',
    name: 'Class 10-A Titans',
    grade: '10',
    section: 'A',
    title: 'Class 10-A Board Examination Circle ⚡',
    tier: 'senior',
    isJuniorPrivate: false,
    description: 'CBSE Board Year Cohort: Past question papers, pre-board schedules, and peer study groups.',
    memberCount: 0,
    classTeacher: 'Assigned Class Teacher',
    color: '#DC2626',
    emoji: '⚡',
    rules: [
      'Focused board exam preparation and query resolution.',
      'Verify note uploads before sharing.',
    ],
    homework: [],
  },
];

export const DEFAULT_BROADCASTS: PrincipalBroadcast[] = [];
export const DEFAULT_STUDY_NOTES: StudyNoteItem[] = [];

// Fallback academic questions if server is initially offline
export const DAILY_QUESTIONS: DailyQuizQuestion[] = [
  {
    id: 'q-2026-11-04',
    subject: 'Science & Discovery',
    question: 'What is the speed of light in vacuum, and which scientist won the Nobel Prize for explaining the photoelectric effect?',
    options: [
      '300,000 km/s — Albert Einstein',
      '150,000 km/s — Isaac Newton',
      '30,000 km/s — Galileo Galilei',
      '3,000,000 km/s — Niels Bohr',
    ],
    correctIndex: 0,
    explanation: 'Light travels at approximately 300,000 km/s (3 × 10⁸ m/s) in a vacuum. Albert Einstein won the 1921 Nobel Prize in Physics for his explanation of the photoelectric effect!',
    points: 10,
    funFact: 'Sunlight takes about 8 minutes and 20 seconds to travel 150 million kilometers to reach your eyes on Earth!',
    difficulty: 'medium',
    aiRankScore: 96,
  },
  {
    id: 'q-2026-11-05',
    subject: 'Mathematics & Logic',
    question: 'If a triangle has angles measuring 50° and 60°, what is the measure of the third angle?',
    options: ['80°', '70°', '90°', '60°'],
    correctIndex: 1,
    explanation: 'The sum of angles in any triangle on a plane is always 180°. 180° - (50° + 60°) = 180° - 110° = 70°.',
    points: 10,
    funFact: 'Triangles are the strongest shape in architecture because their angles cannot deform without bending the edges!',
    difficulty: 'easy',
    aiRankScore: 92,
  },
  {
    id: 'q-2026-11-06',
    subject: 'General Knowledge & Heritage',
    question: 'Which river is known as the "Sorrow of Bihar" due to its recurring annual floods?',
    options: ['Yamuna', 'Kosi', 'Godavari', 'Narmada'],
    correctIndex: 1,
    explanation: 'The Kosi river is known as the Sorrow of Bihar because its unpredictable floodings and changing course cause extensive destruction during the monsoon.',
    points: 10,
    funFact: 'The Kosi river originates in Tibet and flows through Nepal before joining the Ganges in Bihar.',
    difficulty: 'medium',
    aiRankScore: 94,
  },
];

// ============================================================================
// IN-MEMORY REAL-TIME RUNTIME STATE (Synchronized directly with Cloudflare D1 SQL)
// ============================================================================
let dbBroadcasts: PrincipalBroadcast[] = [];
let dbStudyNotes: StudyNoteItem[] = [];
let dbQuestions: DailyQuizQuestion[] = [...DAILY_QUESTIONS];
let dbQuizProgress: UserQuizProgress = { answeredDates: {}, currentStreak: 0, totalPointsWon: 0 };
let dbStudySchedules: DailyStudySchedule[] = [];
let dbLostFound: LostFoundItem[] = [];
let dbWireChannels: CampusWireChannel[] = [];
let dbWireMessages: CampusWireMessage[] = [];
let dbGroupInvites: GroupInvite[] = [];
export const DEFAULT_CAMPUS_DIARY_ENTRIES: ClassDiaryEntry[] = [
  {
    id: 'diary-c8g-today',
    classGrade: '8',
    section: 'G',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Mathematics: Ex 4.2 Q1 to Q6 (Linear equations in one variable)\n• Science: Write reflection laws & ray diagrams in lab file\n• English: Complete Chapter 4 "The Summit Within" word meanings (pg 58)\n• Social Science: Revise Chapter 3 Judiciary notes',
    uploadedByUsername: 'shashwath71845',
    uploadedByName: 'Shashwath Salla',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c8g-yesterday',
    classGrade: '8',
    section: 'G',
    dateStr: '2026-11-04',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Mathematics: Exercise 4.1 Questions 7-12 in Fair Notebook\n• Hindi: Vasant Chapter 6 "Bhagwan ke Dakiye" question answers\n• Science: Read Chapter 5 Coal & Petroleum highlights',
    uploadedByUsername: 'rishi_6f',
    uploadedByName: 'Y Rishikesh Reddy',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: '2026-11-04T09:10:00.000Z',
  },
  {
    id: 'diary-c8a-today',
    classGrade: '8',
    section: 'A',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Maths: Ex 5.1 Data Handling bar graph questions\n• Science: Friction activity 12.3 write-up in physics fair copy\n• Sanskrit: Dhaturup practice table',
    uploadedByUsername: 'rohan_jaddu',
    uploadedByName: 'Rohan Kamboj',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c6f-today',
    classGrade: '6',
    section: 'F',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Maths: Chapter 6 Integers Ex 6.1 on number line\n• Science: Components of Food test tube vitamins chart\n• English: A Tale of Two Birds reading comprehension',
    uploadedByUsername: 'rishi_6f',
    uploadedByName: 'Rishikesh 6f Shashwath Friend',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c7b-today',
    classGrade: '7',
    section: 'B',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Maths: Fractions & Decimals Ex 2.4 multiplication problems\n• Science: Heat transfer conduction & convection diagram\n• English: Honeycomb Chapter 3 Gopal and the Hilsa Fish comic script',
    uploadedByUsername: 'priya_art',
    uploadedByName: 'Priya Patel',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c9a-today',
    classGrade: '9',
    section: 'A',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Mathematics: Polynomials Ex 2.5 identity proofs (Q1-Q8)\n• Physics: Equations of motion numericals pg 108 (Q3, Q5, Q7)\n• Chemistry: Matter in Our Surroundings states of matter evaporation experiment notes',
    uploadedByUsername: 'rishi_sunak_9',
    uploadedByName: 'Rishi Sunak',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c10a-today',
    classGrade: '10',
    section: 'A',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Mathematics: Quadratic Equations CBSE 10-year previous questions (Section B & C)\n• Physics: Ohm\'s law resistance in series & parallel circuit problems\n• Chemistry: Balance 10 redox & displacement chemical equations\n• Biology: Life Processes human heart double circulation diagram with labeling',
    uploadedByUsername: 'aarav_sharma',
    uploadedByName: 'Aarav Sharma',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c10a-yesterday',
    classGrade: '10',
    section: 'A',
    dateStr: '2026-11-04',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Social Science: Nationalism in India timeline of Non-Cooperation Movement\n• English: Footprints Without Feet Chapter 1 "A Triumph of Surgery" character sketch',
    uploadedByUsername: 'aarav_sharma',
    uploadedByName: 'Aarav Sharma',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: '2026-11-04T08:25:00.000Z',
  },
  {
    id: 'diary-c10b-today',
    classGrade: '10',
    section: 'B',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Maths: Arithmetic Progression nth term formula exercise 5.2\n• Science: Magnetic effects of electric current Fleming\'s Left Hand Rule\n• Computer Applications: HTML tables and CSS styling assignment',
    uploadedByUsername: 'vikas_faculty',
    uploadedByName: 'Vikas Sir (Faculty)',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diary-c5a-today',
    classGrade: '5',
    section: 'A',
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homeworkSummary: '• Maths: Area and Perimeter word problems pg 88\n• EVS: Super Senses activity sheet\n• English: Marigold Chapter 4 poem recitation',
    uploadedByUsername: 'anita_faculty',
    uploadedByName: 'Anita Madam (Faculty)',
    isFirstSubmission: true,
    pointsAwarded: 50,
    createdAt: new Date().toISOString(),
  },
];

let dbDiaryEntries: ClassDiaryEntry[] = [...DEFAULT_CAMPUS_DIARY_ENTRIES];
let isFetching = false;

// Real-Time Sync Engine
async function syncFromDatabase(username?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isFetching) return;
  isFetching = true;

  try {
    const url = username ? `/api/campus?username=${encodeURIComponent(username)}` : '/api/campus';
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.broadcasts)) dbBroadcasts = data.broadcasts;
        if (Array.isArray(data.studyNotes)) dbStudyNotes = data.studyNotes;
        if (Array.isArray(data.questions) && data.questions.length > 0) dbQuestions = data.questions;
        if (data.quizProgress) dbQuizProgress = data.quizProgress;
        if (Array.isArray(data.studySchedules)) {
          dbStudySchedules = data.studySchedules.map((s: any) => ({
            id: s.id,
            dateStr: s.dateStr,
            grade: s.goal || 'Class 8',
            totalDurationMin: s.schedule?.items?.reduce((a: number, b: any) => a + (b.durationMin || 0), 0) || 120,
            items: s.schedule?.items || [],
          }));
        }
        if (Array.isArray(data.homework)) {
          for (const cg of OFFICIAL_CLASS_GROUPS) {
            cg.homework = data.homework
              .filter(
                (h: any) =>
                  h.classGrade?.toLowerCase() === cg.grade.toLowerCase() ||
                  h.classGrade?.toLowerCase() === cg.name.toLowerCase()
              )
              .map((h: any) => ({
                subject: h.subject,
                task: h.task,
                dueDate: h.dueDate,
              }));
          }
        }
        if (Array.isArray(data.lostFound)) {
          dbLostFound = data.lostFound;
        }
        if (Array.isArray(data.wireChannels)) {
          dbWireChannels = data.wireChannels;
        }
        if (Array.isArray(data.wireMessages)) {
          dbWireMessages = data.wireMessages;
        }
        if (Array.isArray(data.groupInvites)) {
          dbGroupInvites = data.groupInvites;
        }
        if (Array.isArray(data.diaryEntries)) {
          dbDiaryEntries = data.diaryEntries;
        }
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }
  } catch (err) {
    console.warn('Campus sync notice:', err);
  } finally {
    isFetching = false;
  }
}

// Auto-trigger sync on browser startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncFromDatabase();
  }, 50);

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncFromDatabase();
    }
  });
  window.addEventListener('focus', () => {
    syncFromDatabase();
  });
}

// ============================================================================
// SCHOOL FEATURES ENGINE (Database Backed)
// ============================================================================
export const SchoolFeatures = {
  // Sync on demand
  async sync(username?: string): Promise<void> {
    await syncFromDatabase(username);
  },

  // --- PRINCIPAL BROADCASTS ---
  getBroadcasts(): PrincipalBroadcast[] {
    return dbBroadcasts;
  },

  async createBroadcast(data: {
    title: string;
    message: string;
    targetAudience: 'all' | 'nursery_5' | 'seniors_6_10' | 'teachers';
    priority?: 'urgent' | 'high' | 'normal';
  }): Promise<PrincipalBroadcast> {
    const audienceLabels: Record<string, string> = {
      all: 'Nursery to Class 10 (All Students & Parents)',
      nursery_5: 'Junior Wing (Nursery to Class 5)',
      seniors_6_10: 'Senior Wing (Classes 6 to 10)',
      teachers: 'Faculty & Staff Only',
    };

    const optimistic: PrincipalBroadcast = {
      id: `broadcast-${Date.now()}`,
      title: data.title.trim(),
      message: data.message.trim(),
      sender: 'Office of the Principal',
      senderRole: 'Principal • Delhi Public School',
      senderAvatar: '',
      targetAudience: data.targetAudience,
      targetAudienceLabel: audienceLabels[data.targetAudience] || 'School Wide',
      date: 'Just now',
      priority: data.priority || 'high',
      acknowledgedBy: [],
    };

    dbBroadcasts = [optimistic, ...dbBroadcasts];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_broadcast',
          title: data.title,
          message: data.message,
          targetAudience: data.targetAudience,
          priority: data.priority,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.broadcast) {
          dbBroadcasts = [d.broadcast, ...dbBroadcasts.filter((b) => b.id !== optimistic.id)];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
        }
      }
    } catch (e) {
      console.error('Failed to post broadcast to database:', e);
    }

    return optimistic;
  },

  async acknowledgeBroadcast(broadcastId: string, username: string): Promise<void> {
    const target = dbBroadcasts.find((b) => b.id === broadcastId);
    if (target && !target.acknowledgedBy.includes(username)) {
      target.acknowledgedBy.push(username);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge_broadcast',
          broadcastId,
          username,
        }),
      });
    } catch {}
  },

  // --- CLASS GROUPS ---
  getClassGroups(): OfficialClassGroup[] {
    return OFFICIAL_CLASS_GROUPS;
  },

  getClassGroupForUser(userClass?: string, section?: string): OfficialClassGroup | null {
    if (!userClass) return OFFICIAL_CLASS_GROUPS[5]; // Default to Class 8-A
    const cleanClass = userClass.trim().toLowerCase();
    const cleanSection = (section || 'A').trim().toUpperCase();

    const exact = OFFICIAL_CLASS_GROUPS.find(
      (g) => g.grade.toLowerCase() === cleanClass && (g.section.includes(cleanSection) || g.section === 'A & B')
    );
    if (exact) return exact;

    const gradeMatch = OFFICIAL_CLASS_GROUPS.find((g) => g.grade.toLowerCase() === cleanClass);
    return gradeMatch || OFFICIAL_CLASS_GROUPS[5];
  },

  // --- STUDY CORNER ---
  getStudyNotes(): StudyNoteItem[] {
    return dbStudyNotes;
  },

  async addStudyNote(data: {
    title: string;
    subject: string;
    classGrade: string;
    description: string;
    authorName: string;
    authorUsername: string;
    authorRole?: 'student' | 'teacher';
    authorClass?: string;
    contentPreview: string;
    fileType?: 'pdf' | 'summary' | 'cheat_sheet' | 'notes' | 'image';
    imageUrl?: string;
  }): Promise<StudyNoteItem> {
    const optimistic: StudyNoteItem = {
      id: `note-${Date.now()}`,
      title: data.title.trim(),
      subject: data.subject,
      classGrade: data.classGrade,
      description: data.description.trim(),
      authorName: data.authorName,
      authorUsername: data.authorUsername,
      authorRole: data.authorRole || 'student',
      authorClass: data.authorClass,
      likes: 1,
      likedBy: [data.authorUsername],
      downloads: 1,
      fileType: data.fileType || (data.imageUrl ? 'image' : 'summary'),
      badge: 'Verified Upload ✨',
      createdAt: 'Just now',
      contentPreview: data.contentPreview.trim(),
      imageUrl: data.imageUrl || '',
    };

    dbStudyNotes = [optimistic, ...dbStudyNotes];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_study_note',
          ...data,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.note) {
          dbStudyNotes = [d.note, ...dbStudyNotes.filter((n) => n.id !== optimistic.id)];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
        }
      }
    } catch (e) {
      console.error('Failed to save study note to database:', e);
    }

    return optimistic;
  },

  async toggleLikeStudyNote(noteId: string, username: string): Promise<{ likes: number; isLiked: boolean }> {
    const note = dbStudyNotes.find((n) => n.id === noteId);
    if (!note) return { likes: 0, isLiked: false };

    if (!note.likedBy) note.likedBy = [];
    const idx = note.likedBy.indexOf(username);
    let isLiked = false;
    if (idx >= 0) {
      note.likedBy.splice(idx, 1);
      note.likes = Math.max(0, note.likes - 1);
      isLiked = false;
    } else {
      note.likedBy.push(username);
      note.likes = (note.likes || 0) + 1;
      isLiked = true;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_like_note',
          noteId,
          username,
        }),
      });
    } catch {}

    return { likes: note.likes, isLiked };
  },

  // --- DAILY QUESTION BOX & COMMUNITY AI RANKING ---
  getTodayQuestion(): DailyQuizQuestion {
    if (dbQuestions.length === 0) return DAILY_QUESTIONS[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatch = dbQuestions.find((q) => q.scheduledDate === todayStr);
    if (todayMatch) return todayMatch;

    const d = new Date();
    const dayIndex = d.getDay() % dbQuestions.length;
    return dbQuestions[dayIndex] || dbQuestions[0];
  },

  getQuestionsPool(): DailyQuizQuestion[] {
    return dbQuestions;
  },

  getUserQuizProgress(): UserQuizProgress {
    return dbQuizProgress;
  },

  async submitQuizAnswer(
    questionId: string,
    selectedIndex: number,
    username: string
  ): Promise<{ isCorrect: boolean; explanation: string; points: number; streak?: number }> {
    const q = dbQuestions.find((item) => item.id === questionId) || this.getTodayQuestion();
    const isCorrect = selectedIndex === q.correctIndex;
    const points = isCorrect ? (q.points || 10) : 0;
    const todayStr = new Date().toISOString().split('T')[0];

    if (!dbQuizProgress.answeredDates[todayStr]) {
      dbQuizProgress.answeredDates[todayStr] = {
        questionId,
        selectedIndex,
        isCorrect,
        timestamp: Date.now(),
      };
      if (isCorrect) {
        dbQuizProgress.currentStreak = (dbQuizProgress.currentStreak || 0) + 1;
        dbQuizProgress.totalPointsWon = (dbQuizProgress.totalPointsWon || 0) + points;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_quiz_answer',
          questionId,
          selectedIndex,
          username,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        return {
          isCorrect: d.isCorrect,
          explanation: d.explanation || q.explanation,
          points: d.points || points,
          streak: d.streak,
        };
      }
    } catch (e) {
      console.warn('Database answer submission error:', e);
    }

    return {
      isCorrect,
      explanation: q.explanation,
      points,
    };
  },

  async submitQuestionToAI(data: {
    question: string;
    subject: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    funFact?: string;
    authorUsername: string;
    authorName: string;
  }): Promise<{ success: boolean; question?: DailyQuizQuestion; aiRank?: any; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_question',
          ...data,
        }),
      });
      const result = await res.json();
      if (result.success && result.question) {
        dbQuestions = [result.question, ...dbQuestions];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // --- AI DAILY STUDY SCHEDULER ---
  getUserStudySchedules(): DailyStudySchedule[] {
    return dbStudySchedules;
  },

  async generateStudySchedule(params: {
    username: string;
    grade?: string;
    subjects?: string[];
    targetHours?: number;
    homeworkTasks?: Array<{ subject: string; task: string }>;
  }): Promise<DailyStudySchedule | null> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_study_schedule',
          ...params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          dbStudySchedules = [data.schedule, ...dbStudySchedules];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
          return data.schedule;
        }
      }
    } catch (err) {
      console.error('Failed to generate study schedule in database:', err);
    }
    return null;
  },

  async addHomework(data: {
    classGrade: string;
    section?: string;
    subject: string;
    task: string;
    dueDate?: string;
    teacherName?: string;
  }): Promise<void> {
    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_homework',
          ...data,
        }),
      });
      syncFromDatabase();
    } catch {}
  },

  // --- CLASS DIARY & HOMEWORK IMAGES ---
  getDiaryEntries(classGrade?: string, section?: string): ClassDiaryEntry[] {
    if (!classGrade || classGrade === 'all') return dbDiaryEntries;
    const cleanGrade = classGrade.replace(/[^0-9]/g, '');
    return dbDiaryEntries.filter((d) => {
      const entryGrade = d.classGrade.replace(/[^0-9]/g, '');
      const gradeMatches = cleanGrade ? entryGrade === cleanGrade : d.classGrade.toLowerCase().includes(classGrade.toLowerCase());
      if (!gradeMatches) return false;
      if (section && section !== 'all' && section !== 'All' && d.section) {
        return d.section.toLowerCase() === section.toLowerCase() || d.section.toLowerCase() === 'all';
      }
      return true;
    });
  },

  getTodayDiary(classGrade: string, section?: string): ClassDiaryEntry | null {
    const cleanGrade = classGrade.replace(/[^0-9]/g, '');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatch = dbDiaryEntries.find((d) => {
      const entryGrade = d.classGrade.replace(/[^0-9]/g, '');
      const gradeMatch = (cleanGrade ? entryGrade === cleanGrade : true) && d.dateStr === todayStr;
      if (!gradeMatch) return false;
      if (section && section !== 'all' && section !== 'All' && d.section) {
        return d.section.toLowerCase() === section.toLowerCase() || d.section.toLowerCase() === 'all';
      }
      return true;
    });
    if (todayMatch) return todayMatch;
    // Fallback to latest available for this class and section
    return dbDiaryEntries.find((d) => {
      const entryGrade = d.classGrade.replace(/[^0-9]/g, '');
      const gradeMatch = cleanGrade ? entryGrade === cleanGrade : true;
      if (!gradeMatch) return false;
      if (section && section !== 'all' && section !== 'All' && d.section) {
        return d.section.toLowerCase() === section.toLowerCase() || d.section.toLowerCase() === 'all';
      }
      return true;
    }) || null;
  },

  async uploadDiaryEntry(data: {
    classGrade: string;
    section?: string;
    imageUrl: string;
    homeworkSummary?: string;
    username: string;
    fullName: string;
  }): Promise<{ success: boolean; entry?: ClassDiaryEntry; isFirstSubmission: boolean; pointsAwarded: number; message: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_diary_entry',
          ...data,
        }),
      });
      const json = await res.json();
      if (json.success && json.entry) {
        dbDiaryEntries = [json.entry, ...dbDiaryEntries.filter((d) => d.id !== json.entry.id)];
        if (json.isFirstSubmission && data.username) {
          dbQuizProgress.totalPointsWon = (dbQuizProgress.totalPointsWon || 0) + (json.pointsAwarded || 50);
          try {
            DataStore.addSpiritPoints(data.username, json.pointsAwarded || 50);
          } catch {}
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
      }
      return json;
    } catch (err: any) {
      console.error('Failed to upload diary entry:', err);
      return { success: false, isFirstSubmission: false, pointsAwarded: 0, message: err.message || 'Network error' };
    }
  },

  // --- AI DIARY QUERY ENGINE ---
  queryAiDiary(prompt: string, userClass: string = '8'): {
    answer: string;
    category: string;
    suggestions: string[];
    imageUrl?: string;
    diaryEntry?: ClassDiaryEntry;
    canUploadDiary?: boolean;
    targetClass?: string;
  } {
    const q = prompt.toLowerCase().trim();

    // 1. Study Schedule generation command
    if (q.includes('schedule') || q.includes('timetable') || q.includes('plan my day') || q.includes('routine') || q.includes('study plan')) {
      return {
        category: 'schedule',
        answer: `✨ **Personalized AI Study Scheduler Activated!**\n\nI can analyze your Class ${userClass} subjects, homework deadlines, and upcoming exams to construct an optimized revision schedule with Pomodoro focus blocks.\n\n👉 *Switch to the **"AI Study Schedule"** tab above to generate your customized timetable directly to the cloud database!*`,
        suggestions: ['Generate study schedule', "What is today's homework?", 'Show PA-2 datesheet'],
      };
    }

    // 2. Homework & Diary queries
    if (q.includes('homework') || q.includes('diary') || q.includes('home work') || q.includes('tasks') || q.includes('assignment')) {
      const classMatch = q.match(/class\s*(\d+)/i) || q.match(/(\d+)(?:th|st|nd|rd)\s*class/i);
      const targetClass = classMatch ? classMatch[1] : (userClass.replace(/[^0-9]/g, '') || '8');
      const diaryEntry = this.getTodayDiary(targetClass);

      if (diaryEntry) {
        return {
          category: 'diary_image',
          answer: `📸 **Class ${targetClass} Official Diary Page (${diaryEntry.dateStr}):**\n\n${diaryEntry.isFirstSubmission ? '🏆 **Speed First Submission Winner:** ' : 'Submitted by: '}**${diaryEntry.uploadedByName}** (@${diaryEntry.uploadedByUsername})${diaryEntry.pointsAwarded > 0 ? ` (+${diaryEntry.pointsAwarded} Spirit Points won!)` : ''}\n\n${diaryEntry.homeworkSummary ? `📝 **Today's Homework Summary:**\n${diaryEntry.homeworkSummary}\n\n` : ''}*Here is the verified physical blackboard / diary photo:*`,
          imageUrl: diaryEntry.imageUrl,
          diaryEntry,
          suggestions: ['Plan my study schedule', 'Uniform schedule', 'View all class diaries'],
        };
      }

      const defaultHw = targetClass === '10'
        ? `📚 **Today's Class 10 Homework Diary:**\n\n• **Mathematics:** Solve Section B & C from CBSE Sample Paper 2026.\n• **Physics:** Complete numerical practice on Ohm's Law and resistance circuits.\n• **English:** Write article on "Impact of AI in School Education" (150 words).\n• **Social Science:** Timeline chart of the Non-Cooperation Movement (1920-1922).`
        : `📝 **Today's Class ${targetClass} Homework Diary:**\n\n• **Mathematics:** Exercise 4.2 (Q1 to Q6) on Algebraic Expressions & Identities.\n• **Physics:** Complete lab journal write-up on Laws of Reflection.\n• **English:** Read Chapter 5 "The Summit Within" and note down 10 difficult vocabulary words.\n• **Social Science:** Mark major mineral belts of India on political outline map.`;

      return {
        category: 'homework',
        answer: `${defaultHw}\n\n⚠️ *No student in Class ${targetClass} has uploaded today's physical diary photo yet!*\n\n🏆 **Speed Diary Challenge:** Be the FIRST student in Class ${targetClass} to upload a photo of today's blackboard/diary page to win **+50 Spirit Points**!`,
        canUploadDiary: true,
        targetClass,
        suggestions: ['Upload today diary photo', 'Plan my daily study schedule', 'Uniform schedule'],
      };
    }

    // 3. Uniform schedule queries
    if (q.includes('uniform') || q.includes('dress') || q.includes('shoes') || q.includes('tie') || q.includes('track pant')) {
      return {
        category: 'uniform',
        answer: `👔 **DPS Uniform Code & Schedule:**\n\n• **Monday, Tuesday, Thursday, Friday:**\n  - Regular Formal School Uniform: White shirt, grey trousers/skirt, school tie, black polished leather shoes, and black socks.\n• **Wednesday & Saturday:**\n  - Sports Uniform: Respective DPS Sports Uniform T-shirt, navy blue track pants, and clean white sports sneakers.\n\n*Note: ID cards are mandatory every day.*`,
        suggestions: ['Show today homework', 'When is sports day?', 'School timings'],
      };
    }

    // 4. Exam & Timetable queries
    if (q.includes('exam') || q.includes('test') || q.includes('datesheet') || q.includes('periodic') || q.includes('half yearly')) {
      return {
        category: 'exams',
        answer: `📅 **Upcoming Examination & Assessment Schedule:**\n\n• **Periodic Assessment 2 (PA-2):** December 8 to December 15, 2026.\n• **Reporting Time:** 8:15 AM sharp (No entry after 8:30 AM).\n• **Exam Duration:** 2 Hours (9:00 AM – 11:00 AM).\n• **Syllabus:** Chapters covered from September 1st to November 30th.\n\n*Subject-wise detailed datesheets have been posted under the Notices tab.*`,
        suggestions: ['Show study notes for PA-2', 'Class 8 homework', 'Who to contact for admit card?'],
      };
    }

    // 5. Transport & Bus timings
    if (q.includes('bus') || q.includes('transport') || q.includes('timing') || q.includes('bell') || q.includes('dispersal') || q.includes('pickup')) {
      return {
        category: 'bus',
        answer: `🚌 **School Timings & Transport Schedule:**\n\n• **Morning Entry:** 8:00 AM – 8:15 AM (School gates close at 8:20 AM).\n• **Junior Dispersal (Nursery to Class 2):** 1:30 PM.\n• **Senior Dispersal (Class 3 to 10):** 3:15 PM.\n• **Bus Departure:** Busses leave campus 15 minutes after dispersal.\n\n*For bus route adjustments, contact the Transport Helpdesk via Settings.*`,
        suggestions: ['What is today homework?', 'Madam latest message', 'Uniform rules'],
      };
    }

    // 6. Madam / Principal queries
    if (q.includes('madam') || q.includes('principal') || q.includes('circular') || q.includes('sunitha') || q.includes('office')) {
      return {
        category: 'general',
        answer: `🎓 **Message from Madam (Mrs. Sunitha Rao, Principal):**\n\n"Every child is capable of extraordinary achievements when given a safe, joyful environment to learn. Make sure to complete your daily homework, participate in the Question of the Day, and help your classmates in the Study Corner!"\n\n*Principal's Office Hours for Parents: Monday to Friday, 2:30 PM – 3:30 PM (by appointment).*`,
        suggestions: ['Show latest broadcast', 'What is the Question of the Day?', 'Open Class Groups'],
      };
    }

    // 7. Dynamic Math Linear Equation Solver (e.g., "solve 2x + 5 = 15", "3x = 12", "5x - 7 = 18")
    const linearMatch = q.match(/(?:solve\s*)?(\d+)?x\s*([+-])?\s*(\d+)?\s*=\s*(\d+)/i);
    if (linearMatch && (linearMatch[1] || linearMatch[2])) {
      const a = parseInt(linearMatch[1] || '1', 10);
      const sign = linearMatch[2] || '+';
      const b = parseInt(linearMatch[3] || '0', 10);
      const c = parseInt(linearMatch[4] || '0', 10);

      const rightSide = sign === '+' ? c - b : c + b;
      const xVal = rightSide / a;
      const isInteger = Number.isInteger(xVal);

      return {
        category: 'academic_math',
        answer: `🧮 **Step-by-Step Algebraic Solution:**\n\nGiven equation: **${a === 1 ? '' : a}x ${b > 0 ? `${sign} ${b}` : ''} = ${c}**\n\n` +
          (b > 0 ? `1. **Transpose constant to RHS:**\n   ${a === 1 ? '' : a}x = ${c} ${sign === '+' ? '-' : '+'} ${b} = ${rightSide}\n\n` : '') +
          `2. **Divide both sides by ${a}:**\n   x = ${rightSide} / ${a}\n   **x = ${isInteger ? xVal : xVal.toFixed(2)}**\n\n` +
          `✅ **Verification:** Substituting x = ${isInteger ? xVal : xVal.toFixed(2)} into LHS gives ${a}(${isInteger ? xVal : xVal.toFixed(2)}) ${b > 0 ? `${sign} ${b}` : ''} = ${c} = RHS ✓ (Verified!)`,
        suggestions: ['Solve another equation', 'Pythagoras theorem formula', 'What is today math homework?'],
      };
    }

    // 8. Dynamic Quadratic Equation Solver (e.g., "x^2 - 5x + 6 = 0")
    const quadMatch = q.match(/x\^?2\s*([+-]\s*\d+)?x\s*([+-]\s*\d+)\s*=\s*0/i);
    if (quadMatch) {
      const b = parseInt((quadMatch[1] || '+1').replace(/\s+/g, ''), 10);
      const c = parseInt((quadMatch[2] || '+0').replace(/\s+/g, ''), 10);
      const D = b * b - 4 * 1 * c;
      const sqrtD = Math.sqrt(Math.abs(D));
      const r1 = (-b + sqrtD) / 2;
      const r2 = (-b - sqrtD) / 2;

      return {
        category: 'academic_math',
        answer: `🧮 **Step-by-Step Quadratic Solution for x² ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} = 0:**\n\n` +
          `1. **Discriminant (D = b² - 4ac):**\n   D = (${b})² - 4(1)(${c}) = ${D}\n\n` +
          `2. **Roots via Quadratic Formula (x = (-b ± √D) / (2a)):**\n   **x₁ = ${Number.isInteger(r1) ? r1 : r1.toFixed(2)},  x₂ = ${Number.isInteger(r2) ? r2 : r2.toFixed(2)}**\n\n` +
          `💡 *In CBSE examinations, write down the formula x = (-b ± √(b² - 4ac)) / (2a) before substituting values to secure full method marks!*`,
        suggestions: ['Solve 2x + 7 = 19', 'Trigonometry formulas', 'Class 10 sample papers'],
      };
    }

    // 9. Pythagoras Theorem & Right Angle Triangles
    if (q.includes('pythagoras') || q.includes('hypotenuse') || q.includes('right angle triangle')) {
      return {
        category: 'academic_math',
        answer: `📐 **Pythagoras Theorem (CBSE Mathematics):**\n\nIn any right-angled triangle, the area of the square on the hypotenuse is equal to the sum of the squares on the other two sides:\n\nc² = a² + b²   ⇒   c = √(a² + b²)\n\n• If Base = 3 cm and Perpendicular = 4 cm:\n  c = √(3² + 4²) = √(9 + 16) = √25 = 5 cm\n\n💡 **Pythagorean Triplets to Memorize:** (3, 4, 5), (5, 12, 13), (6, 8, 10), (8, 15, 17).`,
        suggestions: ['Trigonometry ratios', 'Area of triangle formula', 'Class 8 math homework'],
      };
    }

    // 10. Ohm's Law & Physics Circuits
    if (q.includes('ohm') || q.includes('resistance') || q.includes('voltage') || q.includes('circuit')) {
      return {
        category: 'academic_science',
        answer: `⚡ **Ohm's Law & Circuit Formulas (Physics):**\n\nV = I × R\n\n• **V (Potential Difference):** Measured in Volts (V)\n• **I (Electric Current):** Measured in Amperes (A)\n• **R (Resistance):** Measured in Ohms (Ω)\n\n**Example Problem:**\nIf an electric lamp has resistance R = 20 Ω and current I = 0.5 A flows through it:\nV = 0.5 × 20 = 10 Volts\n\n• **Series Resistors:** R_total = R₁ + R₂ + R₃\n• **Parallel Resistors:** 1 / R_total = (1 / R₁) + (1 / R₂) + (1 / R₃)`,
        suggestions: ['Laws of Reflection', 'What is photosynthesis?', 'Physics study notes'],
      };
    }

    // 11. Photosynthesis & Biology
    if (q.includes('photosynthesis') || q.includes('chlorophyll') || q.includes('autotroph')) {
      return {
        category: 'academic_science',
        answer: `🍃 **Photosynthesis: Life Processes (Biology):**\n\n**Balanced Chemical Equation:**\n6 CO₂ + 12 H₂O  --(Sunlight / Chlorophyll)-->  C₆H₁₂O₆ + 6 O₂ + 6 H₂O\n\n**Key Events:**\n1. Absorption of light energy by chlorophyll.\n2. Conversion of light energy into chemical energy and photolysis of water (2 H₂O → 4 H⁺ + O₂ + 4 e⁻).\n3. Reduction of carbon dioxide (CO₂) to carbohydrates (glucose).`,
        suggestions: ['Respiration vs photosynthesis', 'Digestive system organs', 'Plant tissues'],
      };
    }

    // 12. English Letter to Editor Format
    if (q.includes('letter to editor') || q.includes('formal letter') || q.includes('letter format')) {
      return {
        category: 'academic_english',
        answer: `📝 **CBSE Formal Letter to the Editor Format (5 Marks):**\n\n1. **Sender's Address** (2-3 lines, no comma at end of line)\n2. **Date** (e.g. *5th November 2026*)\n3. **The Editor** / *Name of Newspaper* / *City*\n4. **Subject:** Concise & underlined (e.g. *Subject: Reckless driving near school premises*)\n5. **Salutation:** *Sir / Madam*\n6. **Body Paragraphs:**\n   • *Intro:* "Through the columns of your esteemed newspaper, I wish to draw the attention of the authorities..."\n   • *Content:* Cause, impact, and disruption.\n   • *Conclusion:* Constructive solutions & appeal.\n7. **Yours faithfully / Yours sincerely**\n8. **Name & Signature**`,
        suggestions: ['Notice writing format', 'Analytical paragraph format', 'Active and passive voice'],
      };
    }

    // 13. Generic friendly educational assistant
    return {
      category: 'general',
      answer: `Hello! I am your **DPS Buzz AI Academic Copilot** 🐝\n\nSend me your exact problem and I will break it down step-by-step:\n• 🧮 **Mathematics:** Equations (e.g. *"Solve 2x + 5 = 15"* or *"Roots of x^2 - 5x + 6 = 0"*), Pythagoras theorem, Trigonometry.\n• 🔬 **Science:** Physics numericals (Ohm's law V = I × R), Chemistry balancing, Biology life processes.\n• 📝 **English:** Letter to Editor format, Notice writing, Analytical paragraphs.\n• 📸 **Class Diary:** Show verified daily blackboard notes.\n\nType your question above!`,
      suggestions: ['Solve 2x + 7 = 19', 'Explain Ohm law', "Show today's diary image", 'Letter to Editor format'],
    };
  },
  // --- LOST & FOUND ---
  getLostFoundItems(): LostFoundItem[] {
    return dbLostFound;
  },

  async reportLostFound(data: {
    title: string;
    category: string;
    status: 'LOST' | 'FOUND';
    location: string;
    specificSpot?: string;
    description?: string;
    imageUrl?: string;
    reporterUsername: string;
    reporterName: string;
    reporterClass: string;
    reporterSection: string;
    urgent?: boolean;
  }): Promise<LostFoundItem> {
    const optimistic: LostFoundItem = {
      id: `DPS-LF-${1043 + Math.floor(Math.random() * 9000)}`,
      title: data.title.trim(),
      category: data.category,
      status: data.status,
      location: data.location,
      specificSpot: data.specificSpot || data.location,
      description: data.description || 'Reported on DPS Buzz',
      imageUrl: data.imageUrl || '',
      reporterUsername: data.reporterUsername,
      reporterName: data.reporterName,
      reporterClass: data.reporterClass,
      reporterSection: data.reporterSection,
      reporterRole: 'student',
      storageLocation: data.status === 'FOUND' ? 'Main Reception — Lost & Found Desk' : 'Not yet turned in',
      urgent: Boolean(data.urgent || data.status === 'LOST'),
      createdAt: 'Just now',
    };

    dbLostFound = [optimistic, ...dbLostFound];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_lost_found',
          ...data,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.item) {
          dbLostFound = [d.item, ...dbLostFound.filter((i) => i.id !== optimistic.id)];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
          return d.item;
        }
      }
    } catch (e) {
      console.error('Failed to report lost/found to database:', e);
    }
    return optimistic;
  },

  async markItemFound(data: {
    itemId: string;
    finderUsername: string;
    finderName: string;
    finderClass: string;
    finderSection: string;
    finderNotes?: string;
  }): Promise<boolean> {
    const item = dbLostFound.find((i) => i.id === data.itemId);
    if (item) {
      item.status = 'FOUND';
      item.finderUsername = data.finderUsername;
      item.finderName = data.finderName;
      item.finderClass = data.finderClass;
      item.finderSection = data.finderSection;
      item.finderNotes = data.finderNotes || '';
      item.storageLocation = 'Found by classmate • Direct Handover Pending';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_item_found',
          ...data,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- CAMPUS WIRE SCHOOL HUB ---
  getCampusWireChannels(): CampusWireChannel[] {
    return dbWireChannels;
  },

  getCampusWireMessages(channelId?: string): CampusWireMessage[] {
    if (!channelId) return dbWireMessages;
    return dbWireMessages.filter((m) => m.channelId === channelId);
  },

  async sendCampusWireMessage(data: {
    channelId: string;
    senderUsername: string;
    senderName: string;
    senderRole?: 'admin' | 'teacher' | 'student';
    senderClass?: string;
    text: string;
    templateType?: 'none' | 'attendance' | 'homework' | 'exam';
  }): Promise<{ success: boolean; message?: CampusWireMessage; error?: string }> {
    const optimisticMsg: CampusWireMessage = {
      id: `wmsg-${Date.now()}`,
      channelId: data.channelId,
      senderUsername: data.senderUsername,
      senderName: data.senderName,
      senderRole: data.senderRole || 'student',
      senderClass: data.senderClass || 'Class 10',
      text: data.text,
      templateType: data.templateType || 'none',
      timestamp: Date.now(),
    };

    dbWireMessages = [...dbWireMessages, optimisticMsg];
    const ch = dbWireChannels.find((c) => c.id === data.channelId);
    if (ch) {
      ch.lastMessage = data.text.slice(0, 80);
      ch.lastMessageTime = 'Just now';
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_wire_message',
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        dbWireMessages = dbWireMessages.filter((m) => m.id !== optimisticMsg.id);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: false, error: json.error || 'Failed to send message' };
      }
      return { success: true, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleChannelLock(data: {
    channelId: string;
    isLocked: boolean;
    requesterUsername: string;
    requesterRole?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const ch = dbWireChannels.find((c) => c.id === data.channelId);
    if (ch) {
      ch.isLocked = data.isLocked;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_channel_lock',
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (ch) ch.isLocked = !data.isLocked;
        return { success: false, error: json.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createCampusWireChannel(data: {
    name: string;
    grade?: string;
    section?: string;
    isLocked?: boolean;
    requesterUsername?: string;
    requesterRole?: string;
  }): Promise<{ success: boolean; channel?: CampusWireChannel; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_wire_channel',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok && json.channel) {
        dbWireChannels = [...dbWireChannels, json.channel];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, channel: json.channel };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  getGroupInvites(username?: string): GroupInvite[] {
    if (!username) return dbGroupInvites;
    const clean = username.toLowerCase().trim();
    return dbGroupInvites.filter((inv) => inv.inviteeUsername.toLowerCase().trim() === clean);
  },

  async createGroupInvite(data: {
    groupId: string;
    groupName: string;
    inviteeUsername: string;
    inviteeRole?: 'teacher' | 'student';
    subject?: string;
    invitedBy?: string;
  }): Promise<{ success: boolean; invite?: GroupInvite; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_group_invite',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok && json.invite) {
        dbGroupInvites = [json.invite, ...dbGroupInvites];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, invite: json.invite };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async respondGroupInvite(
    inviteId: string,
    response: 'accepted' | 'declined',
    username: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_group_invite',
          inviteId,
          response,
          username,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const inv = dbGroupInvites.find((i) => i.id === inviteId);
        if (inv) inv.status = response;
        await syncFromDatabase();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async requestClassAccess(data: {
    channelId: string;
    username: string;
    fullName: string;
    role?: 'teacher' | 'student';
    subject?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_class_access',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        await syncFromDatabase();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || 'Failed to submit request' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async addStudentToChannel(data: {
    channelId: string;
    usernameToAdd: string;
    studentName?: string;
  }): Promise<{ success: boolean; enrolledUsernames?: string[]; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_student_to_channel',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const ch = dbWireChannels.find((c) => c.id === data.channelId);
        if (ch) {
          ch.enrolledUsernames = json.enrolledUsernames;
          ch.memberCount = (ch.memberCount || 0) + 1;
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, enrolledUsernames: json.enrolledUsernames };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async ingestStudentRoster(data: {
    rawRosterText: string;
    targetChannelId?: string;
  }): Promise<{ success: boolean; enrolledCount?: number; students?: RosterStudent[]; logs?: string[]; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_student_roster',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        await syncFromDatabase();
        return {
          success: true,
          enrolledCount: json.enrolledCount,
          students: json.students,
          logs: json.logs,
        };
      }
      return { success: false, error: json.error, logs: json.logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async dispatchWireTemplate(data: {
    channelId: string;
    templateType: 'attendance' | 'homework' | 'exam';
    content?: string;
    senderName?: string;
  }): Promise<{ success: boolean; message?: CampusWireMessage; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_wire_template',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.message) {
          dbWireMessages = [...dbWireMessages, json.message];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
        }
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async claimLostFound(itemId: string): Promise<boolean> {
    const item = dbLostFound.find((i) => i.id === itemId);
    if (item) {
      item.status = 'CLAIMED';
      item.storageLocation = 'Reunited with owner • Handover Complete';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim_lost_found',
          itemId,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

export const schoolSystem = SchoolFeatures;
