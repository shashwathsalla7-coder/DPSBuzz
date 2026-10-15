import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

import os from 'os';

const CALLS_FILE_LOCAL = path.join(process.cwd(), 'data', 'active_calls.json');
const CALLS_FILE_TMP = path.join(os.tmpdir(), 'dpsbuzz_active_calls.json');

function getWritableCallsFile(): string {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      // Test if dataDir is writable
      const testFile = path.join(dataDir, '.test_write');
      fs.writeFileSync(testFile, '1');
      fs.unlinkSync(testFile);
      return CALLS_FILE_LOCAL;
    }
  } catch {}
  return CALLS_FILE_TMP;
}

// In-memory active calls map + persistent disk fallback
declare global {
  var __dpsbuzz_active_calls: Map<string, CallSession> | undefined;
}

if (!globalThis.__dpsbuzz_active_calls) {
  globalThis.__dpsbuzz_active_calls = new Map<string, CallSession>();
}

const activeCalls = globalThis.__dpsbuzz_active_calls;

// Helper to load calls from disk if map is empty (e.g. across worker processes)
function loadCallsFromDisk() {
  const filesToRead = [CALLS_FILE_LOCAL, CALLS_FILE_TMP];
  for (const file of filesToRead) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ file)) {
        const data = fs.readFileSync(/*turbopackIgnore: true*/ file, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          for (const call of parsed) {
            if (call && call.callId && !activeCalls.has(call.callId)) {
              activeCalls.set(call.callId, call);
            }
          }
        }
      }
    } catch {}
  }
}

// Helper to save calls to disk
function saveCallsToDisk() {
  const callsArray = Array.from(activeCalls.values());
  const data = JSON.stringify(callsArray);
  const targetFile = getWritableCallsFile();

  try {
    fs.writeFileSync(targetFile, data, 'utf-8');
  } catch {
    try {
      fs.writeFileSync(CALLS_FILE_TMP, data, 'utf-8');
    } catch {}
  }
}

// Initial load
loadCallsFromDisk();

function cleanupOldCalls() {
  const now = Date.now();
  let changed = false;

  for (const [id, call] of activeCalls.entries()) {
    // If call has ended and is older than 20 seconds, purge
    if (call.status === 'ended' || call.status === 'rejected') {
      if (now - (call.endedAt || call.createdAt) > 20000) {
        activeCalls.delete(id);
        changed = true;
      }
    } else if (call.status === 'ringing') {
      // Ringing timeout after 45 seconds -> auto-end as missed call
      if (now - call.createdAt > 45000) {
        call.status = 'ended';
        call.endedAt = now;
        call.durationSeconds = 0;
        changed = true;
      }
    }
  }

  if (changed) {
    saveCallsToDisk();
  }
}

export async function GET(req: NextRequest) {
  loadCallsFromDisk();
  cleanupOldCalls();

  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.toLowerCase().trim();
  const callId = searchParams.get('callId');

  if (callId) {
    const call = activeCalls.get(callId);
    return NextResponse.json({ success: true, call: call || null, activeCall: call || null });
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
    loadCallsFromDisk();
    cleanupOldCalls();
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

      activeCalls.set(id, newCall);
      saveCallsToDisk();
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
      saveCallsToDisk();
      return NextResponse.json({ success: true, call });
    }

    if (action === 'reject') {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'rejected';
        call.endedAt = Date.now();
        call.durationSeconds = 0;
        saveCallsToDisk();
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
        saveCallsToDisk();
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
        // Avoid duplicate candidate pushes
        const exists = call.iceCandidates.some(
          (c) => c.sender === sender && JSON.stringify(c.candidate) === JSON.stringify(candidate)
        );
        if (!exists) {
          call.iceCandidates.push({ sender, candidate });
        }
      }

      saveCallsToDisk();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
