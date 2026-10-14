import { NextRequest, NextResponse } from 'next/server';

export interface CallSession {
  callId: string;
  callerUsername: string;
  callerName: string;
  callerAvatar?: string | null;
  receiverUsername: string;
  receiverName?: string;
  receiverAvatar?: string | null;
  isVideo: boolean;
  status: 'ringing' | 'connected' | 'rejected' | 'ended';
  createdAt: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  sdpOffer?: any;
  sdpAnswer?: any;
  iceCandidates?: Array<{ sender: string; candidate: any }>;
}

// In-memory active calls map (scoped across serverless invocations within process)
declare global {
  var __dpsbuzz_active_calls: Map<string, CallSession> | undefined;
}

if (!globalThis.__dpsbuzz_active_calls) {
  globalThis.__dpsbuzz_active_calls = new Map<string, CallSession>();
}

const activeCalls = globalThis.__dpsbuzz_active_calls;

function cleanupOldCalls() {
  const now = Date.now();
  for (const [id, call] of activeCalls.entries()) {
    // If call has ended and is older than 20 seconds, purge
    if (call.status === 'ended' || call.status === 'rejected') {
      if (now - (call.endedAt || call.createdAt) > 20000) {
        activeCalls.delete(id);
      }
    } else if (call.status === 'ringing') {
      // Ringing timeout after 45 seconds -> auto-end as missed call
      if (now - call.createdAt > 45000) {
        call.status = 'ended';
        call.endedAt = now;
        call.durationSeconds = 0;
      }
    }
  }
}

export async function GET(req: NextRequest) {
  cleanupOldCalls();
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.toLowerCase().trim();
  const callId = searchParams.get('callId');

  if (callId) {
    const call = activeCalls.get(callId);
    if (!call) {
      return NextResponse.json({ success: true, call: null });
    }
    return NextResponse.json({ success: true, call });
  }

  if (username) {
    // Find active call involving this user
    for (const call of activeCalls.values()) {
      if (
        (call.receiverUsername.toLowerCase() === username ||
          call.callerUsername.toLowerCase() === username) &&
        call.status !== 'ended' &&
        call.status !== 'rejected'
      ) {
        return NextResponse.json({ success: true, activeCall: call });
      }
    }
  }

  return NextResponse.json({ success: true, activeCall: null });
}

export async function POST(req: NextRequest) {
  try {
    cleanupOldCalls();
    const body = await req.json();
    const { action, callId, callerUsername, callerName, callerAvatar, receiverUsername, receiverName, receiverAvatar, isVideo, sdpOffer, sdpAnswer, candidate, sender } = body;

    if (action === 'initiate') {
      if (!callerUsername || !receiverUsername) {
        return NextResponse.json({ success: false, error: 'Caller and receiver required' }, { status: 400 });
      }

      const id = callId || `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newCall: CallSession = {
        callId: id,
        callerUsername: callerUsername.toLowerCase().trim(),
        callerName: callerName || callerUsername,
        callerAvatar: callerAvatar || null,
        receiverUsername: receiverUsername.toLowerCase().trim(),
        receiverName: receiverName || receiverUsername,
        receiverAvatar: receiverAvatar || null,
        isVideo: Boolean(isVideo),
        status: 'ringing',
        createdAt: Date.now(),
        sdpOffer: sdpOffer || null,
        iceCandidates: [],
      };

      activeCalls.set(id, newCall);
      return NextResponse.json({ success: true, call: newCall });
    }

    if (action === 'answer') {
      const call = activeCalls.get(callId);
      if (!call) {
        return NextResponse.json({ success: false, error: 'Call session not found' }, { status: 404 });
      }
      call.status = 'connected';
      call.connectedAt = Date.now();
      if (sdpAnswer) {
        call.sdpAnswer = sdpAnswer;
      }
      return NextResponse.json({ success: true, call });
    }

    if (action === 'reject') {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'rejected';
        call.endedAt = Date.now();
        call.durationSeconds = 0;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'ended';
        call.endedAt = Date.now();
        if (call.connectedAt) {
          call.durationSeconds = Math.max(1, Math.round((call.endedAt - call.connectedAt) / 1000));
        } else {
          call.durationSeconds = 0;
        }
      }
      return NextResponse.json({ success: true, durationSeconds: call?.durationSeconds || 0 });
    }

    if (action === 'signal') {
      const call = activeCalls.get(callId);
      if (!call) {
        return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 });
      }

      if (sdpOffer) call.sdpOffer = sdpOffer;
      if (sdpAnswer) call.sdpAnswer = sdpAnswer;
      if (candidate && sender) {
        if (!call.iceCandidates) call.iceCandidates = [];
        call.iceCandidates.push({ sender, candidate });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
