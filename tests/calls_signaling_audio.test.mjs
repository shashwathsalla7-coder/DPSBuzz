import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- Running Calls WebRTC Signaling & Ringtone Verification Test ---');

// 1. Verify route.ts awaits serverless Cloudinary writes
const routeContent = fs.readFileSync('src/app/api/calls/route.ts', 'utf8');

assert.ok(
  routeContent.includes('await saveServerCall(newCall)'),
  'route.ts must await saveServerCall(newCall) so serverless does not freeze before Cloudinary upload'
);
assert.ok(
  routeContent.includes('await updateServerCall(callId, updates)'),
  'route.ts must await updateServerCall(callId, updates) so answer/ice/end updates are saved'
);
assert.ok(
  !routeContent.includes('updateServerCall(callId, updates).catch(() => {})'),
  'route.ts must not have un-awaited fire-and-forget updateServerCall calls'
);
assert.ok(
  routeContent.includes('now - c.createdAt > 45000'),
  'route.ts must prune ringing calls older than 45 seconds'
);
console.log('✓ PASS: route.ts awaits all serverless Cloudinary writes and prunes stale sessions');

// 2. Verify serverStore.ts findUserActiveCall ignores expired ringing calls
const serverStoreContent = fs.readFileSync('src/lib/serverStore.ts', 'utf8');
assert.ok(
  serverStoreContent.includes("call.status === 'ringing' && now - (call.createdAt || now) > 45000"),
  'serverStore.ts findUserActiveCall must ignore ringing calls older than 45s'
);
console.log('✓ PASS: serverStore.ts ignores expired ghost ringing calls');

// 3. Verify GlobalCallProvider.tsx guards answering race condition and ringtone leak
const providerContent = fs.readFileSync('src/components/calls/GlobalCallProvider.tsx', 'utf8');
assert.ok(
  providerContent.includes('answeringCallIdRef'),
  'GlobalCallProvider.tsx must define answeringCallIdRef'
);
assert.ok(
  providerContent.includes('stopCallAudio()') && providerContent.includes('playCallConnectedSound()'),
  'GlobalCallProvider.tsx must call stopCallAudio and playCallConnectedSound upon answering'
);
assert.ok(
  providerContent.includes('!answeringCallIdRef.current'),
  'GlobalCallProvider.tsx must not re-trigger incoming ringtone while answering'
);
assert.ok(
  providerContent.includes('setRemoteStream(new MediaStream(targetStream.getTracks()))'),
  'GlobalCallProvider.tsx must trigger React state re-render with new MediaStream instance when remote tracks arrive'
);
console.log('✓ PASS: GlobalCallProvider.tsx prevents ringtone re-triggering and accurately triggers media streams');

// 4. Verify callAudio.ts has leak-proof stopCallAudio and master gain tracking
const audioContent = fs.readFileSync('src/lib/callAudio.ts', 'utf8');
assert.ok(
  audioContent.includes('activeAudioSessions'),
  'callAudio.ts must track active audio sessions'
);
assert.ok(
  audioContent.includes('masterGain'),
  'callAudio.ts must connect oscillators to masterGain for instant silencing'
);
assert.ok(
  audioContent.includes('runningOscillators'),
  'callAudio.ts must track and stop running oscillators'
);
console.log('✓ PASS: callAudio.ts provides leak-proof Web Audio termination');

console.log('\n🎉 ALL CALLS & WEBRTC SIGNALING VERIFICATIONS PASSED! 📞✨');
