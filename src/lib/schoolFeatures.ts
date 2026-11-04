// ============================================================================
// DPS BUZZ - Nursery to Class 10 School System Core
// Powers:
// 1. Madam's Broadcast Desk (Direct Principal to Student/Parent messaging)
// 2. Class Groups (Nursery to Class 10 with Junior Parent-Teacher privacy)
// 3. Study Corner (Collaborative Notes & Revision Sheets)
// 4. Daily Question Box (Daily Quiz & House Points)
// 5. AI Diary Assistant (Instant answers for homework, timetable, exams & school rules)
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
  authorRole: 'student' | 'teacher' | 'club';
  authorClass?: string;
  likes: number;
  likedBy: string[];
  downloads: number;
  fileType: 'pdf' | 'summary' | 'cheat_sheet' | 'notes';
  badge?: string;
  createdAt: string;
  contentPreview: string;
}

export interface DailyQuizQuestion {
  id: string;
  dateStr: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  funFact: string;
}

export interface UserQuizProgress {
  answeredDates: Record<string, { selectedIndex: number; isCorrect: boolean; timestamp: number }>;
  currentStreak: number;
  totalPointsWon: number;
}

// ----------------------------------------------------------------------------
// OFFICIAL SCHOOL CAMPUS DATA
// ----------------------------------------------------------------------------

export const DEFAULT_BROADCASTS: PrincipalBroadcast[] = [];

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

export const DEFAULT_STUDY_NOTES: StudyNoteItem[] = [];

export const DAILY_QUESTIONS: DailyQuizQuestion[] = [
  {
    id: 'q-2026-11-04',
    dateStr: '2026-11-04',
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
  },
  {
    id: 'q-2026-11-05',
    dateStr: '2026-11-05',
    subject: 'Mathematics & Logic',
    question: 'If a triangle has angles measuring 50° and 60°, what is the measure of the third angle?',
    options: ['80°', '70°', '90°', '60°'],
    correctIndex: 1,
    explanation: 'The sum of angles in any triangle on a plane is always 180°. 180° - (50° + 60°) = 180° - 110° = 70°.',
    points: 10,
    funFact: 'Triangles are the strongest shape in architecture because their angles cannot deform without bending the edges!',
  },
  {
    id: 'q-2026-11-06',
    dateStr: '2026-11-06',
    subject: 'General Knowledge & Heritage',
    question: 'Which river is known as the "Sorrow of Bihar" due to its recurring annual floods?',
    options: ['Yamuna', 'Kosi', 'Godavari', 'Narmada'],
    correctIndex: 1,
    explanation: 'The Kosi river is known as the Sorrow of Bihar because its unpredictable floodings and changing course cause extensive destruction during the monsoon.',
    points: 10,
    funFact: 'The Kosi river originates in Tibet and flows through Nepal before joining the Ganges in Bihar.',
  },
];

// ----------------------------------------------------------------------------
// LOCAL STORAGE KEYS & STORE
// ----------------------------------------------------------------------------

const KEYS = {
  BROADCASTS: 'dpsbuzz_principal_broadcasts_v1',
  STUDY_NOTES: 'dpsbuzz_study_notes_v1',
  DAILY_PROGRESS: 'dpsbuzz_daily_quiz_progress_v1',
};

// One-time purge of legacy mock data so visitor browsers start completely fresh
const CLEAN_SEED_KEY = 'dpsbuzz_clean_seed_v2';
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(CLEAN_SEED_KEY)) {
      localStorage.removeItem(KEYS.BROADCASTS);
      localStorage.removeItem(KEYS.STUDY_NOTES);
      localStorage.removeItem(KEYS.DAILY_PROGRESS);
      localStorage.setItem(CLEAN_SEED_KEY, 'true');
    }
  } catch {}
}

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('dpsbuzz:content_updated'));
  } catch {}
}

export const SchoolFeatures = {
  // --- PRINCIPAL BROADCASTS ---
  getBroadcasts(): PrincipalBroadcast[] {
    return getLocal<PrincipalBroadcast[]>(KEYS.BROADCASTS, DEFAULT_BROADCASTS);
  },

  createBroadcast(data: {
    title: string;
    message: string;
    targetAudience: 'all' | 'nursery_5' | 'seniors_6_10' | 'teachers';
    priority?: 'urgent' | 'high' | 'normal';
  }): PrincipalBroadcast {
    const list = this.getBroadcasts();
    const audienceLabels: Record<string, string> = {
      all: 'Nursery to Class 10 (All Students & Parents)',
      nursery_5: 'Junior Wing (Nursery to Class 5)',
      seniors_6_10: 'Senior Wing (Classes 6 to 10)',
      teachers: 'Faculty & Staff Only',
    };

    const newBroadcast: PrincipalBroadcast = {
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

    list.unshift(newBroadcast);
    setLocal(KEYS.BROADCASTS, list);
    return newBroadcast;
  },

  acknowledgeBroadcast(broadcastId: string, username: string): void {
    const list = this.getBroadcasts();
    const target = list.find((b) => b.id === broadcastId);
    if (target && !target.acknowledgedBy.includes(username)) {
      target.acknowledgedBy.push(username);
      setLocal(KEYS.BROADCASTS, list);
    }
  },

  // --- CLASS GROUPS ---
  getClassGroups(): OfficialClassGroup[] {
    return OFFICIAL_CLASS_GROUPS;
  },

  getClassGroupForUser(userClass?: string, section?: string): OfficialClassGroup | null {
    if (!userClass) return OFFICIAL_CLASS_GROUPS[5]; // Default to Class 8-A
    const cleanClass = userClass.trim().toLowerCase();
    const cleanSection = (section || 'A').trim().toUpperCase();

    // Check exact match
    const exact = OFFICIAL_CLASS_GROUPS.find(
      (g) => g.grade.toLowerCase() === cleanClass && (g.section.includes(cleanSection) || g.section === 'A & B')
    );
    if (exact) return exact;

    // Check grade match
    const gradeMatch = OFFICIAL_CLASS_GROUPS.find((g) => g.grade.toLowerCase() === cleanClass);
    return gradeMatch || OFFICIAL_CLASS_GROUPS[5];
  },

  // --- STUDY CORNER ---
  getStudyNotes(): StudyNoteItem[] {
    return getLocal<StudyNoteItem[]>(KEYS.STUDY_NOTES, DEFAULT_STUDY_NOTES);
  },

  addStudyNote(data: {
    title: string;
    subject: string;
    classGrade: string;
    description: string;
    authorName: string;
    authorUsername: string;
    authorRole?: 'student' | 'teacher';
    authorClass?: string;
    contentPreview: string;
    fileType?: 'pdf' | 'summary' | 'cheat_sheet';
  }): StudyNoteItem {
    const list = this.getStudyNotes();
    const newNote: StudyNoteItem = {
      id: `note-${Date.now()}`,
      title: data.title.trim(),
      subject: data.subject,
      classGrade: data.classGrade,
      description: data.description.trim(),
      authorName: data.authorName,
      authorRole: data.authorRole || 'student',
      authorClass: data.authorClass,
      likes: 1,
      likedBy: [data.authorUsername],
      downloads: 1,
      fileType: data.fileType || 'summary',
      badge: 'New Upload ✨',
      createdAt: 'Just now',
      contentPreview: data.contentPreview.trim(),
    };

    list.unshift(newNote);
    setLocal(KEYS.STUDY_NOTES, list);
    return newNote;
  },

  toggleLikeStudyNote(noteId: string, username: string): { likes: number; isLiked: boolean } {
    const list = this.getStudyNotes();
    const note = list.find((n) => n.id === noteId);
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

    setLocal(KEYS.STUDY_NOTES, list);
    return { likes: note.likes, isLiked };
  },

  // --- DAILY QUESTION BOX ---
  getTodayQuestion(): DailyQuizQuestion {
    // Rotate questions based on day of week or current date
    const d = new Date();
    const dayIndex = d.getDay() % DAILY_QUESTIONS.length;
    return DAILY_QUESTIONS[dayIndex] || DAILY_QUESTIONS[0];
  },

  getUserQuizProgress(): UserQuizProgress {
    return getLocal<UserQuizProgress>(KEYS.DAILY_PROGRESS, {
      answeredDates: {},
      currentStreak: 0,
      totalPointsWon: 0,
    });
  },

  submitQuizAnswer(questionId: string, selectedIndex: number): { isCorrect: boolean; explanation: string; points: number } {
    const q = DAILY_QUESTIONS.find((item) => item.id === questionId) || this.getTodayQuestion();
    const isCorrect = selectedIndex === q.correctIndex;
    const progress = this.getUserQuizProgress();

    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyAnswered = Boolean(progress.answeredDates[todayStr]);

    if (!alreadyAnswered) {
      progress.answeredDates[todayStr] = {
        selectedIndex,
        isCorrect,
        timestamp: Date.now(),
      };
      if (isCorrect) {
        progress.currentStreak = (progress.currentStreak || 0) + 1;
        progress.totalPointsWon = (progress.totalPointsWon || 0) + q.points;
      }
      setLocal(KEYS.DAILY_PROGRESS, progress);
    }

    return {
      isCorrect,
      explanation: q.explanation,
      points: isCorrect ? q.points : 0,
    };
  },

  // --- AI DIARY ASSISTANT ENGINE ---
  queryAiDiary(prompt: string, userClass: string = '8'): { answer: string; category: string; suggestions: string[] } {
    const q = prompt.toLowerCase().trim();

    // 1. Homework queries
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

    // 2. Uniform schedule queries
    if (q.includes('uniform') || q.includes('dress') || q.includes('shoes') || q.includes('tie') || q.includes('track pant')) {
      return {
        category: 'uniform',
        answer: `👔 **DPS Uniform Code & Schedule:**\n\n• **Monday, Tuesday, Thursday, Friday:**\n  - Regular Formal School Uniform: White shirt, grey trousers/skirt, school tie, black polished leather shoes, and black socks.\n• **Wednesday & Saturday:**\n  - House Uniform: Respective House T-shirt (Ganges/Yamuna/Kaveri/Krishna), navy blue track pants, and clean white sports sneakers.\n\n*Note: ID cards are mandatory every day.*`,
        suggestions: ['Show today homework', 'When is sports day?', 'School timings'],
      };
    }

    // 3. Exam & Timetable queries
    if (q.includes('exam') || q.includes('test') || q.includes('timetable') || q.includes('datesheet') || q.includes('periodic') || q.includes('half yearly')) {
      return {
        category: 'exams',
        answer: `📅 **Upcoming Examination & Assessment Schedule:**\n\n• **Periodic Assessment 2 (PA-2):** December 8 to December 15, 2026.\n• **Reporting Time:** 8:15 AM sharp (No entry after 8:30 AM).\n• **Exam Duration:** 2 Hours (9:00 AM – 11:00 AM).\n• **Syllabus:** Chapters covered from September 1st to November 30th.\n\n*Subject-wise detailed datesheets have been posted under the Notices tab.*`,
        suggestions: ['Show study notes for PA-2', 'Class 8 homework', 'Who to contact for admit card?'],
      };
    }

    // 4. Transport & Bus timings
    if (q.includes('bus') || q.includes('transport') || q.includes('timing') || q.includes('bell') || q.includes('dispersal') || q.includes('pickup')) {
      return {
        category: 'bus',
        answer: `🚌 **School Timings & Transport Schedule:**\n\n• **Morning Entry:** 8:00 AM – 8:15 AM (School gates close at 8:20 AM).\n• **Junior Dispersal (Nursery to Class 2):** 1:30 PM.\n• **Senior Dispersal (Class 3 to 10):** 3:15 PM.\n• **Bus Departure:** Busses leave campus 15 minutes after dispersal.\n\n*For bus route adjustments, contact the Transport Helpdesk via Settings.*`,
        suggestions: ['What is today homework?', 'Madam latest message', 'Uniform rules'],
      };
    }

    // 5. Madam / Principal queries
    if (q.includes('madam') || q.includes('principal') || q.includes('circular') || q.includes('sunitha') || q.includes('office')) {
      return {
        category: 'general',
        answer: `🎓 **Message from Madam (Mrs. Sunitha Rao, Principal):**\n\n"Every child is capable of extraordinary achievements when given a safe, joyful environment to learn. Make sure to complete your daily homework, participate in the Question of the Day, and help your classmates in the Study Corner!"\n\n*Principal's Office Hours for Parents: Monday to Friday, 2:30 PM – 3:30 PM (by appointment).*`,
        suggestions: ['Show latest broadcast', 'What is the Question of the Day?', 'Open Class Groups'],
      };
    }

    // 6. Generic friendly educational assistant
    return {
      category: 'general',
      answer: `Hello! I am your **DPS Buzz AI Diary Assistant** 🐝\n\nI can help you with:\n1. 📝 **Daily Homework & Diary:** Ask *"What is today's homework for Class ${userClass}?"*\n2. 👔 **Uniform Code:** Ask *"What is tomorrow's uniform schedule?"*\n3. 📅 **Exams & Datesheets:** Ask *"When are the upcoming examinations?"*\n4. 🚌 **Bus Timings:** Ask *"What time does senior dispersal start?"*\n5. 📚 **Study Notes:** Ask *"Where can I find maths formula sheets?"*`,
      suggestions: ["What is today's homework?", 'Uniform schedule', 'Upcoming exam dates', "Show Madam's message"],
    };
  },
};
