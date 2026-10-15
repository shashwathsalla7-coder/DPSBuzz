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

// Helper to safely merge call sessions and prevent reverting connected states
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

  // Merge ICE candidates without duplicates
  const candMap = new Map<string, any>();
  (incoming.iceCandidates || []).forEach((c) => {
    if (c && c.candidate) candMap.set(JSON.stringify(c.candidate), c);
  });
  (existing.iceCandidates || []).forEach((c) => {
    if (c && c.candidate) candMap.set(JSON.stringify(c.candidate), c);
  });

  return {
    ...existing,
    ...incoming,
    status,
    sdpOffer: incoming.sdpOffer || existing.sdpOffer || null,
    sdpAnswer: incoming.sdpAnswer || existing.sdpAnswer || null,
    connectedAt: incoming.connectedAt || existing.connectedAt,
    iceCandidates: Array.from(candMap.values()),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase().trim();
    const callId = searchParams.get('callId');

    const now = Date.now();
    // Prune stale or expired sessions from memory cache
    for (const [id, c] of localCache.entries()) {
      if (!c || !c.callId) {
        localCache.delete(id);
        continue;
      }
      if ((c.status === 'ended' || c.status === 'rejected') && now - (c.endedAt || c.createdAt) > 15000) {
        localCache.delete(id);
        continue;
      }
      if (c.status === 'ringing' && now - c.createdAt > 45000) {
        localCache.delete(id);
        continue;
      }
      if (c.status === 'connected' && now - (c.connectedAt || c.createdAt) > 7200000) {
        localCache.delete(id);
        continue;
      }
    }

    if (callId) {
      const cached = localCache.get(callId) || null;
      const serverCall = await getServerCall(callId);
      const merged = mergeCallSessions(cached, serverCall);
      if (merged) {
        if (merged.status === 'ringing' && now - merged.createdAt > 45000) {
          localCache.delete(callId);
          return NextResponse.json({ success: true, call: null, activeCall: null }, { headers: NO_CACHE_HEADERS });
        }
        localCache.set(callId, merged);
        return NextResponse.json(
          { success: true, call: merged, activeCall: merged },
          { headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json({ success: true, call: null, activeCall: null }, { headers: NO_CACHE_HEADERS });
    }

    if (username) {
      // Check local cache first for valid non-expired active call
      for (const call of localCache.values()) {
        if (
          (call.receiverUsername.toLowerCase().trim() === username ||
            call.callerUsername.toLowerCase().trim() === username) &&
          call.status !== 'ended' &&
          call.status !== 'rejected'
        ) {
          if (call.status === 'ringing' && now - call.createdAt > 45000) {
            localCache.delete(call.callId);
            continue;
          }
          return NextResponse.json({ success: true, activeCall: call }, { headers: NO_CACHE_HEADERS });
        }
      }

      const serverCall = await findUserActiveCall(username);
      if (serverCall) {
        if (serverCall.status === 'ringing' && now - serverCall.createdAt > 45000) {
          return NextResponse.json({ success: true, activeCall: null }, { headers: NO_CACHE_HEADERS });
        }
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
      // Check if any candidates or offer were pre-buffered in localCache
      const existingStub = localCache.get(id);

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
        sdpOffer: sdpOffer || existingStub?.sdpOffer || null,
        iceCandidates: existingStub?.iceCandidates || [],
      };

      localCache.set(id, newCall);
      await saveServerCall(newCall);
      return NextResponse.json({ success: true, call: newCall });
    }

    if (action === 'answer') {
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
          createdAt: Date.now() - 2000,
          connectedAt: Date.now(),
          sdpAnswer: sdpAnswer || null,
          iceCandidates: [],
        };
      }

      if (!call) {
        return NextResponse.json({ success: false, error: 'Call session not found' }, { status: 404 });
      }

      const updates: Partial<CallSession> = {
        status: 'connected',
        connectedAt: Date.now(),
        ...(sdpAnswer ? { sdpAnswer } : {}),
      };

      const updated: CallSession = {
        ...call,
        ...updates,
      };

      localCache.set(callId, updated);
      await updateServerCall(callId, updated);
      return NextResponse.json({ success: true, call: updated });
    }

    if (action === 'reject') {
      const cached = localCache.get(callId) || null;
      const serverCall = await getServerCall(callId);
      const call = mergeCallSessions(cached, serverCall);
      const updates: Partial<CallSession> = {
        status: 'rejected',
        endedAt: Date.now(),
        durationSeconds: 0,
      };
      const finalCall = call ? { ...call, ...updates } : ({ callId, ...updates } as any);
      localCache.set(callId, finalCall);
      setTimeout(() => localCache.delete(callId), 15000);
      await updateServerCall(callId, finalCall);
      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      const cached = localCache.get(callId) || null;
      const serverCall = await getServerCall(callId);
      const call = mergeCallSessions(cached, serverCall);
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
      const finalCall: CallSession = {
        callId,
        callerUsername: call?.callerUsername || body.callerUsername || '',
        callerName: call?.callerName || '',
        callerAvatar: call?.callerAvatar || null,
        receiverUsername: call?.receiverUsername || body.receiverUsername || '',
        receiverName: call?.receiverName || '',
        receiverAvatar: call?.receiverAvatar || null,
        isVideo: call?.isVideo ?? false,
        createdAt: call?.createdAt || Date.now(),
        ...call,
        ...updates,
        status: 'ended',
      };

      // Keep in localCache for 15s so polling peers receive the ended status cleanly
      localCache.set(callId, finalCall);
      setTimeout(() => localCache.delete(callId), 15000);

      await updateServerCall(callId, finalCall);
      return NextResponse.json({ success: true, durationSeconds });
    }

    if (action === 'signal') {
      const cached = localCache.get(callId) || null;
      const serverCall = await getServerCall(callId);
      let call = mergeCallSessions(cached, serverCall);

      // If call session was initiated but not yet written to serverStore, create memory stub so candidates are never lost
      if (!call) {
        const caller = (body.callerUsername || (sender === 'caller' ? body.username : '') || '').toLowerCase().trim();
        const receiver = (body.receiverUsername || (sender === 'receiver' ? body.username : '') || '').toLowerCase().trim();
        call = {
          callId,
          callerUsername: caller,
          callerName: body.callerName || caller,
          callerAvatar: body.callerAvatar || null,
          receiverUsername: receiver,
          receiverName: body.receiverName || receiver,
          receiverAvatar: body.receiverAvatar || null,
          isVideo: Boolean(body.isVideo),
          status: 'ringing',
          createdAt: Date.now(),
          sdpOffer: sdpOffer || null,
          sdpAnswer: sdpAnswer || null,
          iceCandidates: [],
        };
        localCache.set(callId, call);
      }

      const updates: Partial<CallSession> = {};
      if (sdpOffer) updates.sdpOffer = sdpOffer;
      if (sdpAnswer) updates.sdpAnswer = sdpAnswer;

      const candidates = call.iceCandidates ? [...call.iceCandidates] : [];
      let addedAny = false;

      // Handle single candidate (preserving full object with sdpMid & sdpMLineIndex)
      if (candidate && sender) {
        const candObj = typeof candidate === 'object' ? candidate : { candidate };
        const key = typeof candObj.candidate === 'string' ? candObj.candidate : JSON.stringify(candObj);
        const exists = candidates.some(
          (c) => c.sender === sender && (typeof c.candidate === 'string' ? c.candidate : JSON.stringify(c.candidate)) === key
        );
        if (!exists) {
          candidates.push({ sender, candidate: candObj });
          addedAny = true;
        }
      }

      // Handle batch candidates array (preserving full object with sdpMid & sdpMLineIndex)
      if (body.candidates && Array.isArray(body.candidates) && sender) {
        body.candidates.forEach((cand: any) => {
          if (!cand) return;
          const candObj = typeof cand === 'object' ? cand : { candidate: cand };
          const key = typeof candObj.candidate === 'string' ? candObj.candidate : JSON.stringify(candObj);
          const exists = candidates.some(
            (c) => c.sender === sender && (typeof c.candidate === 'string' ? c.candidate : JSON.stringify(c.candidate)) === key
          );
          if (!exists) {
            candidates.push({ sender, candidate: candObj });
            addedAny = true;
          }
        });
      }

      if (addedAny) {
        updates.iceCandidates = candidates;
      }

      if (Object.keys(updates).length > 0) {
        const updated: CallSession = {
          ...call,
          ...updates,
        };
        localCache.set(callId, updated);
        await updateServerCall(callId, updated);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
