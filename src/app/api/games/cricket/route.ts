import { NextRequest, NextResponse } from 'next/server';
import {
  createGameSession,
  getRawGameSession,
  sanitizeGameSession,
  acceptGameInvite,
  declineGameInvite,
  selectSecretCricketer,
  askQuestion,
  answerQuestion,
  submitGuess,
  requestRematch,
  getActiveGameForUser,
  getCricketLeaderboard,
  getCricketMatchHistory,
} from '@/lib/cricketGameStore';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const gameId = searchParams.get('gameId');
    const username = (searchParams.get('username') || '').toLowerCase().trim();

    // 1. Leaderboard request
    if (action === 'leaderboard') {
      const leaderboard = await getCricketLeaderboard();
      return NextResponse.json({ success: true, leaderboard }, { headers: NO_CACHE_HEADERS });
    }

    // 2. Match history request
    if (action === 'history') {
      const history = await getCricketMatchHistory(username || undefined);
      return NextResponse.json({ success: true, history }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Reconnect active game for user
    if (action === 'active' && username) {
      const activeSession = await getActiveGameForUser(username);
      return NextResponse.json({ success: true, session: activeSession }, { headers: NO_CACHE_HEADERS });
    }

    // 4. Specific game session lookup
    if (gameId) {
      const raw = await getRawGameSession(gameId);
      if (!raw) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404, headers: NO_CACHE_HEADERS });
      }
      const sanitized = sanitizeGameSession(raw, username);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'Missing gameId or action' }, { status: 400, headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[API Cricket] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, gameId, username } = body;
    const cleanUser = (username || '').toLowerCase().trim();

    // 1. Invite a player to play Guess the Cricketer
    if (action === 'invite') {
      const { inviter, opponent, chatId } = body;
      if (!inviter?.username || !opponent?.username || !chatId) {
        return NextResponse.json({ success: false, error: 'Missing inviter, opponent or chatId' }, { status: 400 });
      }

      const session = await createGameSession(inviter, opponent, chatId);
      const sanitized = sanitizeGameSession(session, inviter.username);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });
    }

    // 2. Accept invite
    if (action === 'accept') {
      const updated = await acceptGameInvite(gameId, cleanUser);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Could not accept invite' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(updated, cleanUser);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Decline invite
    if (action === 'decline') {
      const updated = await declineGameInvite(gameId, cleanUser);
      return NextResponse.json({ success: true, session: updated }, { headers: NO_CACHE_HEADERS });
    }

    // 4. Select secret cricketer
    if (action === 'select_cricketer') {
      const { cricketerId } = body;
      if (!cricketerId) {
        return NextResponse.json({ success: false, error: 'cricketerId required' }, { status: 400 });
      }
      const res = await selectSecretCricketer(gameId, cleanUser, cricketerId);
      if (!res.success || !res.session) {
        return NextResponse.json({ success: false, error: res.error || 'Failed to select cricketer' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(res.session, cleanUser);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    // 5. Ask a question
    if (action === 'ask_question') {
      const { questionText } = body;
      if (!questionText) {
        return NextResponse.json({ success: false, error: 'questionText required' }, { status: 400 });
      }
      const res = await askQuestion(gameId, cleanUser, questionText);
      if (!res.success || !res.session) {
        return NextResponse.json({ success: false, error: res.error || 'Failed to ask question' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(res.session, cleanUser);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    // 6. Answer a question
    if (action === 'answer_question') {
      const { answer } = body;
      if (!answer) {
        return NextResponse.json({ success: false, error: 'answer required' }, { status: 400 });
      }
      const res = await answerQuestion(gameId, cleanUser, answer);
      if (!res.success || !res.session) {
        return NextResponse.json({ success: false, error: res.error || 'Failed to answer question' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(res.session, cleanUser);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    // 7. Submit a guess
    if (action === 'guess') {
      const { cricketerId } = body;
      if (!cricketerId) {
        return NextResponse.json({ success: false, error: 'cricketerId required' }, { status: 400 });
      }
      const res = await submitGuess(gameId, cleanUser, cricketerId);
      if (!res.success || !res.session) {
        return NextResponse.json({ success: false, error: res.error || 'Failed to submit guess' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(res.session, cleanUser);
      return NextResponse.json(
        { success: true, session: sanitized, isCorrect: res.isCorrect },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 8. Rematch request
    if (action === 'rematch') {
      const res = await requestRematch(gameId, cleanUser);
      if (!res.success || !res.session) {
        return NextResponse.json({ success: false, error: res.error || 'Failed to restart match' }, { status: 400 });
      }
      const sanitized = sanitizeGameSession(res.session, cleanUser);
      return NextResponse.json({ success: true, session: sanitized }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Cricket] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
