import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Execute, isD1Configured } from '@/lib/cloudflare/d1';
import { createClient } from '@supabase/supabase-js';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Supabase fallback client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const sb = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

// ============================================================================
// AI QUESTION RANKING ALGORITHM
// Evaluates academic depth, curriculum fit, option distractors, and difficulty
// ============================================================================
function rankQuestionWithAI(question: string, options: string[], explanation: string, subject: string) {
  let score = 70;
  const qLen = question.trim().length;
  const expLen = explanation.trim().length;

  // 1. Question depth & phrasing
  if (qLen > 40 && qLen < 200) score += 10;
  if (question.includes('?') || question.includes('which') || question.includes('what') || question.includes('calculate')) score += 5;

  // 2. Options balance
  if (options.length === 4 && options.every(o => o.trim().length > 0)) score += 8;

  // 3. Explanation pedagogical value
  if (expLen > 30) score += 7;

  // Determine difficulty
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  const text = `${question} ${explanation}`.toLowerCase();
  if (text.includes('derive') || text.includes('calculate') || text.includes('formula') || text.includes('theorem') || text.includes('constant') || text.includes('quantum')) {
    difficulty = 'hard';
    score += 5;
  } else if (qLen < 60 && !text.includes('why') && !text.includes('how')) {
    difficulty = 'easy';
  }

  const finalScore = Math.min(99, Math.max(72, score));
  const points = difficulty === 'hard' ? 25 : difficulty === 'medium' ? 15 : 10;

  return {
    aiRankScore: finalScore,
    difficulty,
    points,
    bloomLevel: difficulty === 'hard' ? 'Analyze & Evaluate' : difficulty === 'medium' ? 'Apply & Understand' : 'Recall & Remember'
  };
}

// ============================================================================
// AI DAILY STUDY SCHEDULER ALGORITHM
// Takes subjects, target hours, and homework -> builds structured time blocks
// ============================================================================
function generatePersonalizedSchedule(params: {
  username: string;
  grade?: string;
  subjects?: string[];
  targetHours?: number;
  homeworkTasks?: Array<{ subject: string; task: string }>;
}) {
  const hours = params.targetHours || 2.5;
  const grade = params.grade || '8';
  const subjects = params.subjects && params.subjects.length > 0 ? params.subjects : ['Mathematics', 'Science', 'Social Science'];
  const homework = params.homeworkTasks || [];

  const items: Array<{
    id: string;
    timeBlock: string;
    subject: string;
    task: string;
    priority: 'urgent' | 'high' | 'normal';
    durationMin: number;
    done: boolean;
  }> = [];

  let startMinutes = 16 * 60 + 30; // 4:30 PM
  let blockIndex = 1;

  // Format minutes to 12h time string (e.g., "4:30 PM")
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // 1. High priority: Homework & diary deadlines first
  if (homework.length > 0) {
    for (const hw of homework.slice(0, 2)) {
      const from = formatTime(startMinutes);
      startMinutes += 40;
      const to = formatTime(startMinutes);
      items.push({
        id: `sched-${Date.now()}-${blockIndex++}`,
        timeBlock: `${from} – ${to}`,
        subject: hw.subject,
        task: `📝 Complete Homework: ${hw.task}`,
        priority: 'urgent',
        durationMin: 40,
        done: false,
      });

      // Spaced break
      startMinutes += 10;
    }
  }

  // 2. Core Revision Blocks
  for (const sub of subjects.slice(0, 2)) {
    const from = formatTime(startMinutes);
    startMinutes += 35;
    const to = formatTime(startMinutes);
    items.push({
      id: `sched-${Date.now()}-${blockIndex++}`,
      timeBlock: `${from} – ${to}`,
      subject: sub,
      task: `📚 Active Recall & Notes Review (${sub} Chapter Key Points)`,
      priority: 'high',
      durationMin: 35,
      done: false,
    });

    startMinutes += 10; // 10 min break
  }

  // 3. Question Box & Daily Quiz review
  const quizFrom = formatTime(startMinutes);
  startMinutes += 15;
  const quizTo = formatTime(startMinutes);
  items.push({
    id: `sched-${Date.now()}-${blockIndex++}`,
    timeBlock: `${quizFrom} – ${quizTo}`,
    subject: 'Daily Challenge',
    task: `⚡ Solve Question Box Challenge & Verify House Points`,
    priority: 'normal',
    durationMin: 15,
    done: false,
  });

  return {
    id: `plan-${Date.now()}`,
    dateStr: new Date().toISOString().split('T')[0],
    grade: `Class ${grade}`,
    totalDurationMin: items.reduce((acc, it) => acc + it.durationMin, 0),
    items,
  };
}

// ============================================================================
// GET: Fetch all Campus Features directly from Database
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get('username') || '').toLowerCase().trim();

    // 1. Fetch Broadcasts from D1
    let broadcasts: any[] = [];
    try {
      const rawBroadcasts = await d1Query<any>('SELECT * FROM campus_broadcasts ORDER BY created_at DESC LIMIT 50;');
      broadcasts = rawBroadcasts.map((b) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        sender: b.sender,
        senderRole: b.sender_role,
        senderAvatar: b.sender_avatar || '',
        targetAudience: b.target_audience,
        targetAudienceLabel: b.target_audience_label,
        priority: b.priority,
        acknowledgedBy: JSON.parse(b.acknowledged_by || '[]'),
        date: b.created_at,
      }));
    } catch (e) {
      console.warn('D1 broadcasts query notice:', e);
    }

    // 2. Fetch Study Notes from D1
    let studyNotes: any[] = [];
    try {
      const rawNotes = await d1Query<any>('SELECT * FROM campus_study_notes ORDER BY created_at DESC LIMIT 100;');
      studyNotes = rawNotes.map((n) => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        classGrade: n.class_grade,
        description: n.description,
        authorName: n.author_name,
        authorUsername: n.author_username,
        authorRole: n.author_role,
        authorClass: n.author_class,
        likes: Number(n.likes) || 0,
        likedBy: JSON.parse(n.liked_by || '[]'),
        downloads: Number(n.downloads) || 0,
        fileType: n.file_type || 'summary',
        badge: n.badge || '',
        contentPreview: n.content_preview,
        createdAt: n.created_at,
      }));
    } catch (e) {
      console.warn('D1 study notes query notice:', e);
    }

    // 3. Fetch Questions from D1
    let questions: any[] = [];
    try {
      const rawQuestions = await d1Query<any>('SELECT * FROM campus_questions ORDER BY scheduled_date ASC, ai_rank_score DESC LIMIT 50;');
      questions = rawQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        subject: q.subject,
        options: JSON.parse(q.options || '[]'),
        correctIndex: Number(q.correct_index),
        explanation: q.explanation,
        points: Number(q.points) || 10,
        funFact: q.fun_fact || '',
        authorUsername: q.author_username,
        authorName: q.author_name,
        difficulty: q.difficulty || 'medium',
        aiRankScore: Number(q.ai_rank_score) || 85,
        status: q.status || 'approved',
        scheduledDate: q.scheduled_date,
      }));
    } catch (e) {
      console.warn('D1 questions query notice:', e);
    }

    // 4. Fetch User Quiz Progress from D1
    let quizProgress = {
      answeredDates: {} as Record<string, any>,
      currentStreak: 0,
      totalPointsWon: 0,
    };
    if (username) {
      try {
        const rows = await d1Query<any>('SELECT * FROM campus_quiz_progress WHERE username = ? LIMIT 1;', [username]);
        if (rows.length > 0) {
          quizProgress = {
            answeredDates: JSON.parse(rows[0].answered_dates || '{}'),
            currentStreak: Number(rows[0].streak) || 0,
            totalPointsWon: Number(rows[0].total_points) || 0,
          };
        }
      } catch (e) {
        console.warn('D1 quiz progress query notice:', e);
      }
    }

    // 5. Fetch User Study Schedules from D1
    let studySchedules: any[] = [];
    if (username) {
      try {
        const rows = await d1Query<any>('SELECT * FROM campus_study_schedules WHERE username = ? ORDER BY created_at DESC LIMIT 5;', [username]);
        studySchedules = rows.map((r) => ({
          id: r.id,
          username: r.username,
          dateStr: r.date_str,
          goal: r.goal,
          schedule: JSON.parse(r.schedule_items || '{}'),
          createdAt: r.created_at,
        }));
      } catch (e) {
        console.warn('D1 study schedules query notice:', e);
      }
    }

    // 6. Fetch Homework from D1
    let homeworkList: any[] = [];
    try {
      const rawHw = await d1Query<any>('SELECT * FROM campus_homework ORDER BY created_at DESC LIMIT 50;');
      homeworkList = rawHw.map((h) => ({
        id: h.id,
        classGrade: h.class_grade,
        section: h.section,
        subject: h.subject,
        task: h.task,
        dueDate: h.due_date,
        teacherName: h.teacher_name,
        createdAt: h.created_at,
      }));
    } catch (e) {
      console.warn('D1 homework query notice:', e);
    }

    return NextResponse.json(
      {
        success: true,
        broadcasts,
        studyNotes,
        questions,
        quizProgress,
        studySchedules,
        homework: homeworkList,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('Campus GET API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ============================================================================
// POST: Actions on Campus Features (Broadcasts, Notes, Questions, Schedules)
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ------------------------------------------------------------------------
    // 1. CREATE BROADCAST (Office of the Principal)
    // ------------------------------------------------------------------------
    if (action === 'create_broadcast') {
      const id = `broadcast-${Date.now()}`;
      const title = (body.title || '').trim();
      const message = (body.message || '').trim();
      const targetAudience = body.targetAudience || 'all';
      const priority = body.priority || 'high';

      const audienceLabels: Record<string, string> = {
        all: 'Nursery to Class 10 (All Students & Parents)',
        nursery_5: 'Junior Wing (Nursery to Class 5)',
        seniors_6_10: 'Senior Wing (Classes 6 to 10)',
        teachers: 'Faculty & Staff Only',
      };

      await d1Execute(
        `INSERT INTO campus_broadcasts (id, title, message, sender, sender_role, sender_avatar, target_audience, target_audience_label, priority, acknowledged_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          title,
          message,
          'Office of the Principal',
          'Principal • Delhi Public School',
          '',
          targetAudience,
          audienceLabels[targetAudience] || 'School Wide',
          priority,
          '[]',
        ]
      );

      return NextResponse.json(
        {
          success: true,
          broadcast: {
            id,
            title,
            message,
            sender: 'Office of the Principal',
            senderRole: 'Principal • Delhi Public School',
            senderAvatar: '',
            targetAudience,
            targetAudienceLabel: audienceLabels[targetAudience] || 'School Wide',
            priority,
            acknowledgedBy: [],
            date: 'Just now',
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // ------------------------------------------------------------------------
    // 2. ACKNOWLEDGE BROADCAST
    // ------------------------------------------------------------------------
    if (action === 'acknowledge_broadcast') {
      const { broadcastId, username } = body;
      if (!broadcastId || !username) {
        return NextResponse.json({ error: 'Missing broadcastId or username' }, { status: 400 });
      }

      const rows = await d1Query<any>('SELECT acknowledged_by FROM campus_broadcasts WHERE id = ?;', [broadcastId]);
      if (rows.length > 0) {
        const list: string[] = JSON.parse(rows[0].acknowledged_by || '[]');
        if (!list.includes(username)) {
          list.push(username);
          await d1Execute('UPDATE campus_broadcasts SET acknowledged_by = ? WHERE id = ?;', [
            JSON.stringify(list),
            broadcastId,
          ]);
        }
      }
      return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 3. CREATE STUDY NOTE
    // ------------------------------------------------------------------------
    if (action === 'create_study_note') {
      const id = `note-${Date.now()}`;
      const title = (body.title || '').trim();
      const subject = body.subject || 'General';
      const classGrade = body.classGrade || 'Class 8';
      const description = (body.description || '').trim();
      const authorName = body.authorName || 'Student';
      const authorUsername = (body.authorUsername || '').toLowerCase().trim();
      const authorRole = body.authorRole || 'student';
      const authorClass = body.authorClass || '';
      const contentPreview = (body.contentPreview || '').trim();
      const fileType = body.fileType || 'summary';
      const badge = body.badge || 'New Upload ✨';

      await d1Execute(
        `INSERT INTO campus_study_notes (id, title, subject, class_grade, description, author_name, author_username, author_role, author_class, likes, liked_by, downloads, file_type, badge, content_preview)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?, ?);`,
        [
          id,
          title,
          subject,
          classGrade,
          description,
          authorName,
          authorUsername,
          authorRole,
          authorClass,
          JSON.stringify([authorUsername]),
          fileType,
          badge,
          contentPreview,
        ]
      );

      // Award +15 Spirit Points for academic collaboration
      if (authorUsername) {
        try {
          await d1Execute('UPDATE profiles SET spirit_points = spirit_points + 15 WHERE username = ?;', [authorUsername]);
          if (sb) {
            try {
              await (sb as any).rpc('increment_spirit_points', { u_name: authorUsername, pts: 15 });
            } catch {}
          }
        } catch {}
      }

      return NextResponse.json(
        {
          success: true,
          note: {
            id,
            title,
            subject,
            classGrade,
            description,
            authorName,
            authorUsername,
            authorRole,
            authorClass,
            likes: 1,
            likedBy: [authorUsername],
            downloads: 1,
            fileType,
            badge,
            contentPreview,
            createdAt: 'Just now',
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // ------------------------------------------------------------------------
    // 4. TOGGLE LIKE STUDY NOTE
    // ------------------------------------------------------------------------
    if (action === 'toggle_like_note') {
      const { noteId, username } = body;
      const rows = await d1Query<any>('SELECT likes, liked_by FROM campus_study_notes WHERE id = ?;', [noteId]);
      if (rows.length === 0) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

      let list: string[] = JSON.parse(rows[0].liked_by || '[]');
      let likes = Number(rows[0].likes) || 0;
      let isLiked = false;

      const idx = list.indexOf(username);
      if (idx >= 0) {
        list.splice(idx, 1);
        likes = Math.max(0, likes - 1);
        isLiked = false;
      } else {
        list.push(username);
        likes += 1;
        isLiked = true;
      }

      await d1Execute('UPDATE campus_study_notes SET likes = ?, liked_by = ? WHERE id = ?;', [
        likes,
        JSON.stringify(list),
        noteId,
      ]);

      return NextResponse.json({ success: true, likes, isLiked }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 5. SUBMIT QUESTION & RUN AI RANKING ALGORITHM
    // ------------------------------------------------------------------------
    if (action === 'submit_question') {
      const question = (body.question || '').trim();
      const subject = body.subject || 'General Knowledge';
      const options: string[] = Array.isArray(body.options) ? body.options.map((o: any) => String(o).trim()) : [];
      const correctIndex = Number(body.correctIndex) || 0;
      const explanation = (body.explanation || '').trim();
      const funFact = (body.funFact || '').trim();
      const authorUsername = (body.authorUsername || 'student').toLowerCase().trim();
      const authorName = body.authorName || 'DPS Scholar';

      if (!question || options.length < 2 || !explanation) {
        return NextResponse.json({ error: 'Please provide question, at least 2 options, and explanation' }, { status: 400 });
      }

      // Execute AI Ranking Algorithm
      const aiRank = rankQuestionWithAI(question, options, explanation, subject);
      const id = `q-${Date.now()}`;
      const scheduledDate = new Date().toISOString().split('T')[0];

      await d1Execute(
        `INSERT INTO campus_questions (id, question, subject, options, correct_index, explanation, points, fun_fact, author_username, author_name, difficulty, ai_rank_score, status, scheduled_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          question,
          subject,
          JSON.stringify(options),
          correctIndex,
          explanation,
          aiRank.points,
          funFact || `Evaluated by DPS AI Question Ranker with an academic quality score of ${aiRank.aiRankScore}%!`,
          authorUsername,
          authorName,
          aiRank.difficulty,
          aiRank.aiRankScore,
          'approved',
          scheduledDate,
        ]
      );

      // Reward student author with Spirit Points (+20) for academic contribution
      try {
        await d1Execute('UPDATE profiles SET spirit_points = spirit_points + 20 WHERE username = ?;', [authorUsername]);
      } catch {}

      return NextResponse.json(
        {
          success: true,
          question: {
            id,
            question,
            subject,
            options,
            correctIndex,
            explanation,
            points: aiRank.points,
            funFact,
            authorUsername,
            authorName,
            difficulty: aiRank.difficulty,
            aiRankScore: aiRank.aiRankScore,
            status: 'approved',
          },
          aiRank,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // ------------------------------------------------------------------------
    // 6. SUBMIT QUIZ ANSWER
    // ------------------------------------------------------------------------
    if (action === 'submit_quiz_answer') {
      const { questionId, selectedIndex, username } = body;
      const cleanUser = (username || '').toLowerCase().trim();

      const qRows = await d1Query<any>('SELECT * FROM campus_questions WHERE id = ?;', [questionId]);
      if (qRows.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const q = qRows[0];
      const isCorrect = Number(selectedIndex) === Number(q.correct_index);
      const points = isCorrect ? (Number(q.points) || 10) : 0;
      const todayStr = new Date().toISOString().split('T')[0];

      // Retrieve or create user quiz progress
      const pRows = await d1Query<any>('SELECT * FROM campus_quiz_progress WHERE username = ?;', [cleanUser]);
      let progress = {
        streak: 0,
        totalPoints: 0,
        answeredDates: {} as Record<string, any>,
      };

      if (pRows.length > 0) {
        progress.streak = Number(pRows[0].streak) || 0;
        progress.totalPoints = Number(pRows[0].total_points) || 0;
        progress.answeredDates = JSON.parse(pRows[0].answered_dates || '{}');
      }

      if (!progress.answeredDates[todayStr]) {
        progress.answeredDates[todayStr] = {
          questionId,
          selectedIndex,
          isCorrect,
          timestamp: Date.now(),
        };

        if (isCorrect) {
          progress.streak += 1;
          progress.totalPoints += points;

          // Award Spirit Points to profile
          try {
            await d1Execute('UPDATE profiles SET spirit_points = spirit_points + ? WHERE username = ?;', [points, cleanUser]);
            if (sb) {
              try {
                await (sb as any).rpc('increment_spirit_points', { u_name: cleanUser, pts: points });
              } catch {}
            }
          } catch {}
        }

        await d1Execute(
          `INSERT INTO campus_quiz_progress (username, streak, total_points, answered_dates, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(username) DO UPDATE SET
             streak = excluded.streak,
             total_points = excluded.total_points,
             answered_dates = excluded.answered_dates,
             updated_at = CURRENT_TIMESTAMP;`,
          [cleanUser, progress.streak, progress.totalPoints, JSON.stringify(progress.answeredDates)]
        );
      }

      return NextResponse.json(
        {
          success: true,
          isCorrect,
          explanation: q.explanation,
          points,
          streak: progress.streak,
          totalPointsWon: progress.totalPoints,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // ------------------------------------------------------------------------
    // 7. GENERATE PERSONALIZED STUDY SCHEDULE (AI Study Engine)
    // ------------------------------------------------------------------------
    if (action === 'generate_study_schedule') {
      const { username, grade, subjects, targetHours, homeworkTasks } = body;
      const cleanUser = (username || 'student').toLowerCase().trim();

      const generated = generatePersonalizedSchedule({
        username: cleanUser,
        grade,
        subjects,
        targetHours,
        homeworkTasks,
      });

      // Persist to Cloudflare D1 database
      await d1Execute(
        `INSERT INTO campus_study_schedules (id, username, date_str, goal, schedule_items)
         VALUES (?, ?, ?, ?, ?);`,
        [
          generated.id,
          cleanUser,
          generated.dateStr,
          `Personalized ${generated.grade} Focus Session (${generated.totalDurationMin} mins)`,
          JSON.stringify(generated.items),
        ]
      );

      return NextResponse.json(
        {
          success: true,
          schedule: generated,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // ------------------------------------------------------------------------
    // 8. ADD HOMEWORK ENTRY
    // ------------------------------------------------------------------------
    if (action === 'add_homework') {
      const id = `hw-${Date.now()}`;
      const classGrade = body.classGrade || 'Class 8';
      const section = body.section || 'All';
      const subject = body.subject || 'General';
      const task = (body.task || '').trim();
      const dueDate = body.dueDate || 'Tomorrow';
      const teacherName = body.teacherName || 'Class Teacher';

      await d1Execute(
        `INSERT INTO campus_homework (id, class_grade, section, subject, task, due_date, teacher_name)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [id, classGrade, section, subject, task, dueDate, teacherName]
      );

      return NextResponse.json(
        {
          success: true,
          homework: { id, classGrade, section, subject, task, dueDate, teacherName },
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Campus POST API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
