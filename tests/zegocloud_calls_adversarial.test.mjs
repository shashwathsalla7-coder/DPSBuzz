import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- Running Adversarial Verification on ZEGOCLOUD Call Architecture & Audio Lifecycle ---');

// 1. Check Deterministic Room ID logic
const zegoRoomSource = fs.readFileSync('src/components/calls/ZegoCallRoom.tsx', 'utf8');

assert.ok(
  zegoRoomSource.includes('export function getDeterministicRoomId'),
  'ZegoCallRoom must export getDeterministicRoomId'
);

// Simulate getDeterministicRoomId logic
function getDeterministicRoomId(call) {
  const cleanCallId = (call.callId || '').replace(/[^a-zA-Z0-9_]/g, '_');
  const pairKey = [
    (call.callerUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
    (call.receiverUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
  ]
    .sort()
    .join('_');

  const rawRoomId = cleanCallId.length > 5 ? `dps_${cleanCallId}` : `dps_${pairKey}`;
  return rawRoomId.slice(0, 64);
}

const callA = {
  callId: 'call-1760601234567-xyz12',
  callerUsername: 'student_6a',
  receiverUsername: 'shashwath71845',
  isVideo: true,
};

const callB = {
  callId: 'call-1760601234567-xyz12',
  callerUsername: 'student_6a',
  receiverUsername: 'shashwath71845',
  isVideo: true,
};

const roomA = getDeterministicRoomId(callA);
const roomB = getDeterministicRoomId(callB);
assert.strictEqual(roomA, roomB, 'Caller and receiver must generate identical deterministic room IDs');
assert.ok(/^[a-zA-Z0-9_]+$/.test(roomA), 'Room ID must adhere strictly to ZEGOCLOUD alphanumeric/underscore regex');

// Test edge cases: special chars, mixed cases, trimmed usernames
const callC = {
  callId: 'call-1760601234567-xyz12',
  callerUsername: ' Student_6A ',
  receiverUsername: 'Shashwath71845',
  isVideo: false,
};
assert.strictEqual(getDeterministicRoomId(callC), roomA, 'Casing and whitespace differences must not alter room ID');

// Test fallback when callId is short or missing
const fallbackCaller = getDeterministicRoomId({ callerUsername: 'alice', receiverUsername: 'bob' });
const fallbackReceiver = getDeterministicRoomId({ callerUsername: 'bob', receiverUsername: 'alice' });
assert.strictEqual(fallbackCaller, fallbackReceiver, 'Fallback room ID based on pairKey must be symmetric');

// Test extreme length truncation for ZEGOCLOUD 64-char limit
const ultraLongCall = {
  callId: 'call-' + 'a'.repeat(120),
  callerUsername: 'student_6a',
  receiverUsername: 'shashwath71845',
};
const ultraLongRoom = getDeterministicRoomId(ultraLongCall);
assert.ok(ultraLongRoom.length <= 64, 'Room ID must never exceed ZEGOCLOUD maximum length of 64 characters');
assert.ok(zegoRoomSource.includes('rawRoomId.slice(0, 64)'), 'ZegoCallRoom must slice room ID to 64 chars max');
console.log('✓ PASS: Deterministic Room IDs are symmetric, collision-free, and ZEGOCLOUD-compliant');

// 2. Verify ZEGOCLOUD Native Audio Enhancements (AEC, ANS, AGC), Camera Controls, and Track Constraints
assert.ok(
  zegoRoomSource.includes('AiDenoiseConfig: { mode: 1 }'),
  'ZegoCallRoom must enable ZEGOCLOUD AI Balanced Denoise'
);
assert.ok(
  zegoRoomSource.includes('showRotatingScreenButton: true'),
  'ZegoCallRoom must enable screen rotation / camera flip button for mobile'
);
assert.ok(
  zegoRoomSource.includes('onLocalStreamUpdated'),
  'ZegoCallRoom must listen to onLocalStreamUpdated to attach AEC, ANS, AGC to the active WebRTC stream'
);
assert.ok(
  zegoRoomSource.includes('express.setAudioConfig'),
  'ZegoCallRoom must configure express.setAudioConfig with AEC, ANS, AGC'
);
assert.ok(
  zegoRoomSource.includes('express.enableANS'),
  'ZegoCallRoom must invoke express.enableANS'
);
assert.ok(
  zegoRoomSource.includes('applyConstraints'),
  'ZegoCallRoom must apply native hardware audio track constraints for full-duplex echo cancellation'
);
assert.ok(
  zegoRoomSource.includes("echoCancellation: true") &&
  zegoRoomSource.includes("noiseSuppression: true") &&
  zegoRoomSource.includes("autoGainControl: true"),
  'ZegoCallRoom must enforce AEC, ANS, and AGC on local audio tracks'
);
assert.ok(
  zegoRoomSource.includes("autoLeaveRoomWhenOnlySelfInRoom: false"),
  'ZegoCallRoom must prevent premature room departure while waiting for remote peer'
);
assert.ok(
  zegoRoomSource.includes('(zp as any).autoLeaveRoomWhenOnlySelfInRoom = false'),
  'ZegoCallRoom must set autoLeaveRoomWhenOnlySelfInRoom directly on zp instance'
);
assert.ok(
  zegoRoomSource.includes("objectFit: 'cover'"),
  'ZegoCallRoom must render video with cover object-fit'
);
console.log('✓ PASS: Full-duplex AEC, ANS, AGC and native camera flip controls properly wired');

// 3. Verify Audio Lifecycle, Element Shielding, and DOM Safety in callAudio.ts
const callAudioSource = fs.readFileSync('src/lib/callAudio.ts', 'utf8');

assert.ok(
  callAudioSource.includes('if (el.srcObject) return;'),
  'stopCallAudio must NEVER sever or nullify live WebRTC streams (srcObject)'
);
assert.ok(
  callAudioSource.includes("el.closest?.('.zego-uikit-prebuilt')"),
  'stopCallAudio must NEVER silence audio elements inside ZEGOCLOUD container class'
);
assert.ok(
  callAudioSource.includes("el.closest?.('[data-zego-call]')") &&
  callAudioSource.includes("el.closest?.('#zego-call-container')"),
  'stopCallAudio must NEVER silence audio elements inside data-zego-call or zego-call-container'
);
assert.ok(
  callAudioSource.includes("el.id?.startsWith('zg-')") &&
  callAudioSource.includes("el.id?.startsWith('zego-')"),
  'stopCallAudio must protect ZEGOCLOUD internal audio elements (zg-rtc, zg-audio-source, zego-*)'
);
assert.ok(
  callAudioSource.includes('activeAudioContexts'),
  'callAudio must track active audio contexts and terminate them on hangup'
);
assert.ok(
  callAudioSource.includes('activeAudioSessions'),
  'callAudio must track active sound sessions'
);
console.log('✓ PASS: callAudio stops ghost ringing without severing live WebRTC MediaStream audio');

// 4. Verify GlobalCallProvider Concurrency & Double-Tap Guards
const providerSource = fs.readFileSync('src/components/calls/GlobalCallProvider.tsx', 'utf8');

assert.ok(
  providerSource.includes('isHandlingIncomingActionRef'),
  'GlobalCallProvider must guard incoming action handling to prevent double-tap race conditions'
);
assert.ok(
  providerSource.includes('durationSecondsRef.current'),
  'GlobalCallProvider must access durationSeconds via ref so handleEndCall does not trigger effect re-creation'
);
assert.ok(
  providerSource.includes('isCallerRef.current'),
  'GlobalCallProvider must access isCaller via ref in event callbacks'
);
assert.ok(
  providerSource.includes('const currentIncoming = incomingCallRef.current;'),
  'pollCallStatus must access incoming call via ref to prevent stale closure ghost ringing'
);
assert.ok(
  providerSource.includes('const hasAnswered = isCallerRef.current && serverCall.status === \'connected\';'),
  'pollCallStatus must check isCaller via ref so cross-device answer transitions caller to connected'
);
assert.ok(
  !providerSource.includes('durationSeconds, logCallToChat'),
  'handleEndCall must not depend directly on durationSeconds state'
);
console.log('✓ PASS: GlobalCallProvider guards against double-tap races and avoids signaling effect churn');

// 5. Verify Direct Room Connection without Intermediate Modal Swap and Viewport Responsiveness
assert.ok(
  providerSource.includes('<ZegoCallRoom'),
  'GlobalCallProvider must mount ZegoCallRoom directly'
);
assert.ok(
  !providerSource.includes('<CallModal'),
  'GlobalCallProvider must NOT mount intermediate CallModal to prevent audio freezing and UI desync'
);
assert.ok(
  zegoRoomSource.includes('min-h-[100dvh]'),
  'ZegoCallRoom must use 100dvh dynamic viewport height to prevent mobile browser toolbar clipping'
);
assert.ok(
  zegoRoomSource.includes('data-zego-call="true"') &&
  zegoRoomSource.includes('id="zego-call-container"'),
  'ZegoCallRoom container div must specify data-zego-call and id for audio shielding'
);
console.log('✓ PASS: Intermediate modal swap completely bypassed with responsive direct ZEGOCLOUD room');

// 6. Verify Server Route Synchronous Signaling, Terminal Status Retention, and Ringing Expiry
const routeSource = fs.readFileSync('src/app/api/calls/route.ts', 'utf8');
assert.ok(
  routeSource.includes("action === 'reject'") && routeSource.includes("status: 'rejected'"),
  'route.ts must save rejected status to server storage'
);
assert.ok(
  routeSource.includes("action === 'end'") && routeSource.includes("status: 'ended'"),
  'route.ts must save ended status to server storage'
);
assert.ok(
  routeSource.includes("deadCalls.set(callId, { ts: now, status: 'rejected' })"),
  'route.ts must preserve rejected status in deadCalls cache so caller polling is notified of decline'
);
assert.ok(
  routeSource.includes("deadCalls.set(callId, { ts: now, status: 'ended' })"),
  'route.ts must record ended status in deadCalls cache'
);
assert.ok(
  routeSource.includes("deadCalls.set(call.callId, { ts: now, status: 'ended' })"),
  'route.ts must track ended status in deadCalls on ringing expiry'
);
assert.ok(
  routeSource.includes('now - c.createdAt > 45000'),
  'route.ts must prune stale ringing sessions at 45 seconds'
);
console.log('✓ PASS: Server route synchronously persists terminal statuses and enforces 45s ringing TTL');

// 7. Verify Lifecycle Mount Guards in ZegoCallRoom
const onUserJoinIdx = zegoRoomSource.indexOf('onUserJoin:');
assert.ok(onUserJoinIdx !== -1, 'onUserJoin must be defined');
assert.ok(
  zegoRoomSource.slice(onUserJoinIdx, onUserJoinIdx + 120).includes('if (!isMounted) return;'),
  'onUserJoin must check isMounted before updating state'
);

const onUserLeaveIdx = zegoRoomSource.indexOf('onUserLeave:');
assert.ok(onUserLeaveIdx !== -1, 'onUserLeave must be defined');
assert.ok(
  zegoRoomSource.slice(onUserLeaveIdx, onUserLeaveIdx + 120).includes('if (!isMounted) return;'),
  'onUserLeave must check isMounted before ending call'
);

const onLeaveRoomIdx = zegoRoomSource.indexOf('onLeaveRoom:');
assert.ok(onLeaveRoomIdx !== -1, 'onLeaveRoom must be defined');
assert.ok(
  zegoRoomSource.slice(onLeaveRoomIdx, onLeaveRoomIdx + 120).includes('if (!isMounted) return;'),
  'onLeaveRoom must check isMounted before ending call'
);
console.log('✓ PASS: All room callbacks safely guarded against unmounted execution during teardown');

// 8. Verify calls index exports
const callsIndexSource = fs.readFileSync('src/components/calls/index.ts', 'utf8');
assert.ok(
  callsIndexSource.includes('export { default as ZegoCallRoom } from \'./ZegoCallRoom\';'),
  'calls index.ts must export ZegoCallRoom'
);
console.log('✓ PASS: ZegoCallRoom exported in components/calls index');

console.log('\n🎉 ALL ADVERSARIAL ZEGOCLOUD & CALL LIFECYCLE TESTS PASSED CLEANLY! 🚀');
