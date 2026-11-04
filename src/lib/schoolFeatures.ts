// ============================================================================
// DPS BUZZ - Nursery to Class 10 School System Core
// Full Cloud Database Backed (Cloudflare D1 SQL + Supabase Persistence)
// Powers:
// 1. Madam's Broadcast Desk (Direct Principal to Student/Parent messaging)
// 2. Class Groups (Nursery to Class 10 with Junior Parent-Teacher privacy)
// 3. Study Corner (Collaborative Notes & Revision Sheets)
// 4. Daily Question Box (AI Ranked Question Algorithm & House Points)
// 5. AI Diary & Intelligent Study Scheduler
// ============================================================================

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

export interface WhatsAppChannel {
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

export interface WhatsAppMessage {
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
let dbWhatsAppChannels: WhatsAppChannel[] = [];
let dbWhatsAppMessages: WhatsAppMessage[] = [];
let dbGroupInvites: GroupInvite[] = [];
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
        if (Array.isArray(data.whatsappChannels)) {
          dbWhatsAppChannels = data.whatsappChannels;
        }
        if (Array.isArray(data.whatsappMessages)) {
          dbWhatsAppMessages = data.whatsappMessages;
        }
        if (Array.isArray(data.groupInvites)) {
          dbGroupInvites = data.groupInvites;
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

  // --- AI DIARY QUERY ENGINE ---
  queryAiDiary(prompt: string, userClass: string = '8'): { answer: string; category: string; suggestions: string[] } {
    const q = prompt.toLowerCase().trim();

    // 1. Study Schedule generation command
    if (q.includes('schedule') || q.includes('timetable') || q.includes('plan my day') || q.includes('routine') || q.includes('study plan')) {
      return {
        category: 'schedule',
        answer: `✨ **Personalized AI Study Scheduler Activated!**\n\nI can analyze your Class ${userClass} subjects, homework deadlines, and upcoming exams to construct an optimized revision schedule with Pomodoro focus blocks.\n\n👉 *Switch to the **"AI Study Schedule"** tab above to generate your customized timetable directly to the cloud database!*`,
        suggestions: ['Generate study schedule', "What is today's homework?", 'Show PA-2 datesheet'],
      };
    }

    // 2. Homework queries
    if (q.includes('homework') || q.includes('diary') || q.includes('home work') || q.includes('tasks') || q.includes('assignment')) {
      if (userClass.includes('10')) {
        return {
          category: 'homework',
          answer: `📚 **Today's Class 10 Homework Diary:**\n\n• **Mathematics:** Solve Section B & C from CBSE Sample Paper 2026.\n• **Physics:** Complete numerical practice on Ohm's Law and resistance circuits.\n• **English:** Write article on "Impact of AI in School Education" (150 words).\n• **Social Science:** Timeline chart of the Non-Cooperation Movement (1920-1922).`,
          suggestions: ['When are pre-board exams?', 'What is tomorrow uniform?', 'Show physics formula cheat sheet'],
        };
      }
      return {
        category: 'homework',
        answer: `📝 **Today's Class 8 Homework Diary:**\n\n• **Mathematics:** Exercise 4.2 (Q1 to Q6) on Algebraic Expressions & Identities.\n• **Physics:** Complete lab journal write-up on Laws of Reflection.\n• **English:** Read Chapter 5 "The Summit Within" and note down 10 difficult vocabulary words.\n• **Social Science:** Mark major mineral belts of India on political outline map.\n\n*All homework is due tomorrow morning during zero period.*`,
        suggestions: ['What is the uniform tomorrow?', 'When are half-yearly exams?', 'Bus timings for today'],
      };
    }

    // 3. Uniform schedule queries
    if (q.includes('uniform') || q.includes('dress') || q.includes('shoes') || q.includes('tie') || q.includes('track pant')) {
      return {
        category: 'uniform',
        answer: `👔 **DPS Uniform Code & Schedule:**\n\n• **Monday, Tuesday, Thursday, Friday:**\n  - Regular Formal School Uniform: White shirt, grey trousers/skirt, school tie, black polished leather shoes, and black socks.\n• **Wednesday & Saturday:**\n  - House Uniform: Respective House T-shirt (Ganges/Yamuna/Kaveri/Krishna), navy blue track pants, and clean white sports sneakers.\n\n*Note: ID cards are mandatory every day.*`,
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

    // 7. Generic friendly educational assistant
    return {
      category: 'general',
      answer: `Hello! I am your **DPS Buzz AI Diary Assistant** 🐝\n\nI can help you with:\n1. 📅 **AI Daily Study Schedule:** Ask *"Plan my study schedule for today"*\n2. 📝 **Daily Homework & Diary:** Ask *"What is today's homework for Class ${userClass}?"*\n3. 👔 **Uniform Code:** Ask *"What is tomorrow's uniform schedule?"*\n4. 📅 **Exams & Datesheets:** Ask *"When are the upcoming examinations?"*\n5. 🚌 **Bus Timings:** Ask *"What time does senior dispersal start?"*\n6. 📚 **Study Notes:** Ask *"Where can I find maths formula sheets?"*`,
      suggestions: ['Plan my study schedule', "What is today's homework?", 'Uniform schedule', 'Upcoming exam dates'],
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
      description: data.description || 'Reported on DPSBuzz',
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

  // --- WHATSAPP SCHOOL HUB ---
  getWhatsAppChannels(): WhatsAppChannel[] {
    return dbWhatsAppChannels;
  },

  getWhatsAppMessages(channelId?: string): WhatsAppMessage[] {
    if (!channelId) return dbWhatsAppMessages;
    return dbWhatsAppMessages.filter((m) => m.channelId === channelId);
  },

  async sendWhatsAppMessage(data: {
    channelId: string;
    senderUsername: string;
    senderName: string;
    senderRole?: 'admin' | 'teacher' | 'student';
    senderClass?: string;
    text: string;
    templateType?: 'none' | 'attendance' | 'homework' | 'exam';
  }): Promise<{ success: boolean; message?: WhatsAppMessage; error?: string }> {
    const optimisticMsg: WhatsAppMessage = {
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

    dbWhatsAppMessages = [...dbWhatsAppMessages, optimisticMsg];
    const ch = dbWhatsAppChannels.find((c) => c.id === data.channelId);
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
          action: 'send_whatsapp_message',
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        dbWhatsAppMessages = dbWhatsAppMessages.filter((m) => m.id !== optimisticMsg.id);
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
    const ch = dbWhatsAppChannels.find((c) => c.id === data.channelId);
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

  async createWhatsAppChannel(data: {
    name: string;
    grade?: string;
    section?: string;
    isLocked?: boolean;
    requesterUsername?: string;
    requesterRole?: string;
  }): Promise<{ success: boolean; channel?: WhatsAppChannel; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_whatsapp_channel',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok && json.channel) {
        dbWhatsAppChannels = [...dbWhatsAppChannels, json.channel];
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
        const ch = dbWhatsAppChannels.find((c) => c.id === data.channelId);
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

  async dispatchWhatsAppTemplate(data: {
    channelId: string;
    templateType: 'attendance' | 'homework' | 'exam';
    content?: string;
    senderName?: string;
  }): Promise<{ success: boolean; message?: WhatsAppMessage; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_whatsapp_template',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.message) {
          dbWhatsAppMessages = [...dbWhatsAppMessages, json.message];
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
