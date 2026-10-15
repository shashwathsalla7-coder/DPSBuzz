import { NextRequest, NextResponse } from 'next/server';
import type { CallSession } from '@/lib/dataStore';
import {
  getServerCall,
  findUserActiveCall,
  saveServerCall,
  updateServerCall,
  deleteServerCall,
  getServerActiveCalls,
} from '@/lib/serverStore';

export type { CallSession };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// In-memory fast cache for instantaneous same-container lookups
declare global {
  var __dpsbuzz_active_calls: Map<string, CallSession> | undefined;
}

if (!globalThis.__dpsbuzz_active_calls) {
  globalThis.__dpsbuzz_active_calls = new Map<string, CallSession>();
}

const localCache = globalThis.__dpsbuzz_active_calls;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase().trim();
    const callId = searchParams.get('callId');

    if (callId) {
      const serverCall = await getServerCall(callId);
      if (serverCall) {
        localCache.set(callId, serverCall);
        return NextResponse.json(
          { success: true, call: serverCall, activeCall: serverCall },
          { headers: NO_CACHE_HEADERS }
        );
      }
      const call = localCache.get(callId) || null;
      return NextResponse.json(
        { success: true, call, activeCall: call },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (username) {
      const serverCall = await findUserActiveCall(username);
      if (serverCall) {
        localCache.set(serverCall.callId, serverCall);
        return NextResponse.json(
          { success: true, activeCall: serverCall },
          { headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json({ success: true, activeCall: null }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, activeCall: null }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ success: true, activeCall: null }, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      callId,
      callerUsername,
      callerName,
      callerAvatar,
      receiverUsername,
      receiverName,
      receiverAvatar,
      isVideo,
      sdpOffer,
      sdpAnswer,
      candidate,
      sender,
    } = body;

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

      localCache.set(id, newCall);
      await saveServerCall(newCall);
      return NextResponse.json({ success: true, call: newCall });
    }

    if (action === 'answer') {
      let call = localCache.get(callId) || (await getServerCall(callId));
      if (!call) {
        return NextResponse.json({ success: false, error: 'Call session not found' }, { status: 404 });
      }

      const updates: Partial<CallSession> = {
        status: 'connected',
        connectedAt: Date.now(),
        ...(sdpAnswer ? { sdpAnswer } : {}),
      };

      const updated = await updateServerCall(callId, updates);
      if (updated) {
        localCache.set(callId, updated);
      }
      return NextResponse.json({ success: true, call: updated || call });
    }

    if (action === 'reject') {
      const updates: Partial<CallSession> = {
        status: 'rejected',
        endedAt: Date.now(),
        durationSeconds: 0,
      };
      await updateServerCall(callId, updates);
      localCache.delete(callId);
      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      let call = localCache.get(callId) || (await getServerCall(callId));
      const endedAt = Date.now();
      let durationSeconds = 0;
      if (call?.connectedAt) {
        durationSeconds = Math.max(1, Math.round((endedAt - call.connectedAt) / 1000));
      }

      const updates: Partial<CallSession> = {
        status: 'ended',
        endedAt,
        durationSeconds,
      };
      await updateServerCall(callId, updates);
      localCache.delete(callId);
      return NextResponse.json({ success: true, durationSeconds });
    }

    if (action === 'signal') {
      let call = localCache.get(callId) || (await getServerCall(callId));
      if (!call) {
        return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 });
      }

      const updates: Partial<CallSession> = {};
      if (sdpOffer) updates.sdpOffer = sdpOffer;
      if (sdpAnswer) updates.sdpAnswer = sdpAnswer;

      if (candidate && sender) {
        const candidates = call.iceCandidates ? [...call.iceCandidates] : [];
        const exists = candidates.some(
          (c) => c.sender === sender && JSON.stringify(c.candidate) === JSON.stringify(candidate)
        );
        if (!exists) {
          candidates.push({ sender, candidate });
          updates.iceCandidates = candidates;
        }
      }

      if (Object.keys(updates).length > 0) {
        const updated = await updateServerCall(callId, updates);
        if (updated) {
          localCache.set(callId, updated);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
