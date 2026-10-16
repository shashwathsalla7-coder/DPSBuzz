import { NextRequest, NextResponse } from 'next/server';
import type { CallSession } from '@/lib/dataStore';
import {
  getServerCall,
  findUserActiveCall,
  saveServerCall,
  updateServerCall,
  deleteServerCall,
} from '@/lib/serverStore';

export type { CallSession };

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// In-memory fast cache for instantaneous same-container lookups
type DeadCallEntry = { ts: number; status: 'ended' | 'rejected' };

declare global {
  var __dpsbuzz_active_calls: Map<string, CallSession> | undefined;
  var __dpsbuzz_dead_calls: Map<string, DeadCallEntry | number> | undefined;
}

if (!globalThis.__dpsbuzz_active_calls) {
  globalThis.__dpsbuzz_active_calls = new Map<string, CallSession>();
}
if (!globalThis.__dpsbuzz_dead_calls) {
  globalThis.__dpsbuzz_dead_calls = new Map<string, DeadCallEntry | number>();
}

const localCache = globalThis.__dpsbuzz_active_calls;
const deadCalls = globalThis.__dpsbuzz_dead_calls;

// Helper to safely merge call sessions and prevent reviving ended calls
function mergeCallSessions(
  existing: CallSession | null | undefined,
  incoming: CallSession | null | undefined
): CallSession | null {
  if (!existing) return incoming || null;
  if (!incoming) return existing || null;

  // Terminal states preserve termination
  if (existing.status === 'ended' || existing.status === 'rejected') return existing;
  if (incoming.status === 'ended' || incoming.status === 'rejected') return incoming;

  // Never revert a connected call back to ringing
  const status =
    existing.status === 'connected' || incoming.status === 'connected'
      ? 'connected'
      : (incoming.status || existing.status);

  return {
    ...existing,
    ...incoming,
    status,
    connectedAt: incoming.connectedAt || existing.connectedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase().trim();
    const callId = searchParams.get('callId');

    const now = Date.now();

    // 1. Prune dead calls older than 60s
    for (const [id, val] of deadCalls.entries()) {
      const ts = typeof val === 'number' ? val : val.ts;
      if (now - ts > 60000) {
        deadCalls.delete(id);
      }
    }

    // 2. Prune stale sessions from local cache
    for (const [id, c] of localCache.entries()) {
      if (!c || !c.callId || deadCalls.has(id)) {
        localCache.delete(id);
        continue;
      }
      if ((c.status === 'ended' || c.status === 'rejected') && now - (c.endedAt || c.createdAt) > 10000) {
        deadCalls.set(id, { ts: now, status: c.status });
        localCache.delete(id);
        continue;
      }
      if (c.status === 'ringing' && now - c.createdAt > 45000) {
        deadCalls.set(id, { ts: now, status: 'ended' });
        localCache.delete(id);
        continue;
      }
      if (c.status === 'connected' && now - (c.connectedAt || c.createdAt) > 7200000) {
        deadCalls.set(id, { ts: now, status: 'ended' });
        localCache.delete(id);
        continue;
      }
    }

    // 3. Resolve specific callId if requested
    let callForId: CallSession | null = null;
    if (callId) {
      const deadInfo = deadCalls.get(callId);
      if (deadInfo) {
        const deadStatus = typeof deadInfo === 'object' && deadInfo.status ? deadInfo.status : 'ended';
        callForId = {
          callId,
          callerUsername: '',
          callerName: '',
          receiverUsername: '',
          receiverName: '',
          isVideo: false,
          status: deadStatus,
          createdAt: now - 5000,
          endedAt: now,
        };
      } else {
        const cached = localCache.get(callId) || null;
        const serverCall = await getServerCall(callId);
        callForId = mergeCallSessions(cached, serverCall);
        if (callForId) {
          if (callForId.status === 'ended' || callForId.status === 'rejected') {
            deadCalls.set(callId, { ts: now, status: callForId.status });
            localCache.delete(callId);
          } else if (callForId.status === 'ringing' && now - callForId.createdAt > 45000) {
            deadCalls.set(callId, { ts: now, status: 'ended' });
            localCache.delete(callId);
            callForId = null;
          } else {
            localCache.set(callId, callForId);
          }
        }
      }
    }

    // 4. Resolve active call for username (polling for incoming or active calls)
    let userActiveCall: CallSession | null = null;
    if (username) {
      // Check local cache first for valid ringing or connected call
      for (const call of localCache.values()) {
        if (deadCalls.has(call.callId)) continue;
        if (
          (call.receiverUsername.toLowerCase().trim() === username ||
            call.callerUsername.toLowerCase().trim() === username) &&
          call.status !== 'ended' &&
          call.status !== 'rejected'
        ) {
          if (call.status === 'ringing' && now - call.createdAt > 45000) {
            deadCalls.set(call.callId, { ts: now, status: 'ended' });
            localCache.delete(call.callId);
            continue;
          }
          userActiveCall = call;
          break;
        }
      }

      // Fallback check from persistent store if not in memory
      if (!userActiveCall) {
        const serverCall = await findUserActiveCall(username);
        if (serverCall && !deadCalls.has(serverCall.callId)) {
          if (!(serverCall.status === 'ringing' && now - serverCall.createdAt > 45000)) {
            userActiveCall = serverCall;
            localCache.set(serverCall.callId, serverCall);
          }
        }
      }
    }

    const resolvedActive =
      userActiveCall ||
      (callForId && (callForId.status === 'ringing' || callForId.status === 'connected') ? callForId : null);

    return NextResponse.json(
      {
        success: true,
        call: callForId,
        activeCall: resolvedActive,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ success: true, call: null, activeCall: null }, { headers: NO_CACHE_HEADERS });
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
    } = body;

    const now = Date.now();

    if (action === 'initiate') {
      if (!callerUsername || !receiverUsername) {
        return NextResponse.json({ success: false, error: 'Caller and receiver required' }, { status: 400 });
      }

      const id = callId || `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      // Clear from dead calls if previously present
      deadCalls.delete(id);

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
        createdAt: now,
      };

      localCache.set(id, newCall);
      await saveServerCall(newCall);
      return NextResponse.json({ success: true, call: newCall });
    }

    if (action === 'answer') {
      // Guard: if call already dead or cancelled by caller, reject answer
      if (deadCalls.has(callId)) {
        return NextResponse.json({ success: false, error: 'Call already ended by caller' }, { status: 200 });
      }

      const cached = localCache.get(callId) || null;
      const serverCall = await getServerCall(callId);
      let call = mergeCallSessions(cached, serverCall);

      if (!call && (body.callerUsername || body.receiverUsername)) {
        call = {
          callId,
          callerUsername: (body.callerUsername || '').toLowerCase().trim(),
          callerName: body.callerName || body.callerUsername || '',
          callerAvatar: body.callerAvatar || null,
          receiverUsername: (body.receiverUsername || '').toLowerCase().trim(),
          receiverName: body.receiverName || body.receiverUsername || '',
          receiverAvatar: body.receiverAvatar || null,
          isVideo: Boolean(body.isVideo),
          status: 'connected',
          createdAt: now - 2000,
          connectedAt: now,
        };
      }

      if (!call || call.status === 'ended' || call.status === 'rejected') {
        deadCalls.set(callId, { ts: now, status: (call?.status as any) || 'ended' });
        localCache.delete(callId);
        return NextResponse.json({ success: false, error: 'Call session not active' }, { status: 200 });
      }

      const updates: CallSession = {
        ...call,
        status: 'connected',
        connectedAt: now,
      };

      localCache.set(callId, updates);
      await updateServerCall(callId, updates);
      return NextResponse.json({ success: true, call: updates });
    }

    if (action === 'reject') {
      deadCalls.set(callId, { ts: now, status: 'rejected' });
      const updates: Partial<CallSession> = {
        status: 'rejected',
        endedAt: now,
        durationSeconds: 0,
      };
      const existing = localCache.get(callId);
      if (existing) {
        localCache.set(callId, { ...existing, ...updates });
      }
      await updateServerCall(callId, updates);
      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      deadCalls.set(callId, { ts: now, status: 'ended' });
      const updates: Partial<CallSession> = {
        status: 'ended',
        endedAt: now,
      };
      const existing = localCache.get(callId);
      if (existing) {
        localCache.set(callId, { ...existing, ...updates });
      }
      await updateServerCall(callId, updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
