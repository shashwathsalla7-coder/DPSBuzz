import { NextRequest, NextResponse } from 'next/server';
import {
  createConnect4Session,
  getConnect4Session,
  acceptConnect4Invite,
  declineConnect4Invite,
  dropConnect4Piece,
  forfeitConnect4Game,
  requestConnect4Rematch,
  setConnect4Difficulty,
  getActiveConnect4GameForUser,
  getConnect4Leaderboard,
  getConnect4MatchHistory,
} from '@/lib/connect4GameStore';

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
    const username = (searchParams.get('username') || searchParams.get('viewer') || '').toLowerCase().trim();
    const targetUser = (searchParams.get('targetUser') || '').toLowerCase().trim();

    // 1. Leaderboard
    if (action === 'leaderboard') {
      const leaderboard = await getConnect4Leaderboard(username);
      return NextResponse.json({ success: true, leaderboard }, { headers: NO_CACHE_HEADERS });
    }

    // 2. Match History
    if (action === 'history') {
      const history = await getConnect4MatchHistory(targetUser || undefined, username || undefined);
      return NextResponse.json({ success: true, history }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Reconnect active game for user
    if (action === 'active' && username) {
      const activeSession = await getActiveConnect4GameForUser(username);
      return NextResponse.json({ success: true, session: activeSession }, { headers: NO_CACHE_HEADERS });
    }

    // 4. Specific game session lookup
    if (gameId) {
      const session = await getConnect4Session(gameId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Connect 4 game not found' }, { status: 404, headers: NO_CACHE_HEADERS });
      }
      return NextResponse.json({ success: true, session }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'Missing gameId or action' }, { status: 400, headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[API Connect4] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, gameId, username } = body;
    const cleanUser = (username || '').toLowerCase().trim();

    // 1. Invite a player to play Connect 4
    if (action === 'invite') {
      const { inviter, opponent, chatId, difficulty } = body;
      if (!inviter?.username || !opponent?.username || !chatId) {
        return NextResponse.json({ success: false, error: 'Missing inviter, opponent or chatId' }, { status: 400 });
      }

      const session = await createConnect4Session(
        inviter,
        { ...opponent, difficulty: difficulty || opponent.difficulty },
        chatId,
        difficulty || opponent.difficulty || 'hard'
      );
      return NextResponse.json({ success: true, session }, { headers: NO_CACHE_HEADERS });
    }

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });
    }

    // 2. Accept invite
    if (action === 'accept') {
      const updated = await acceptConnect4Invite(gameId, cleanUser);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Cannot accept this invite' }, { status: 400 });
      }
      return NextResponse.json({ success: true, session: updated }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Decline invite
    if (action === 'decline') {
      const updated = await declineConnect4Invite(gameId, cleanUser);
      return NextResponse.json({ success: true, session: updated }, { headers: NO_CACHE_HEADERS });
    }

    // 4. Drop piece
    if (action === 'drop') {
      const { col } = body;
      if (typeof col !== 'number') {
        return NextResponse.json({ success: false, error: 'col (column number) is required' }, { status: 400 });
      }
      const res = await dropConnect4Piece(gameId, cleanUser, col);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        session: res.session,
        humanMove: res.humanMove,
        botMove: res.botMove,
      }, { headers: NO_CACHE_HEADERS });
    }

    // 5. Forfeit / Resign
    if (action === 'forfeit') {
      const updated = await forfeitConnect4Game(gameId, cleanUser);
      return NextResponse.json({ success: true, session: updated }, { headers: NO_CACHE_HEADERS });
    }

    // 6. Set Difficulty (while playing vs BuzzBot)
    if (action === 'set_difficulty') {
      const { difficulty } = body;
      if (!difficulty) {
        return NextResponse.json({ success: false, error: 'difficulty required' }, { status: 400 });
      }
      const updated = await setConnect4Difficulty(gameId, difficulty);
      return NextResponse.json({ success: true, session: updated }, { headers: NO_CACHE_HEADERS });
    }

    // 7. Rematch
    if (action === 'rematch') {
      const { difficulty } = body;
      const newSession = await requestConnect4Rematch(gameId, cleanUser, difficulty);
      if (!newSession) {
        return NextResponse.json({ success: false, error: 'Cannot start rematch' }, { status: 400 });
      }
      return NextResponse.json({ success: true, session: newSession }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Connect4] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
