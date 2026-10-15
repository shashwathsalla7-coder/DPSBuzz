// Unit test for Song Chorus & Trimmer Logic
const assert = require('assert');

function calculateDuration(track) {
  if (track.previewUrl && track.previewUrl.startsWith('data:audio/')) {
    return 180;
  }
  return 30;
}

function getChorusOffset(totalSeconds) {
  return totalSeconds > 60 ? 60 : 14;
}

function formatSec(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// 1. Test 30s preview
const previewTrack = { id: 'track-1', title: 'Aaya Sher', artist: 'Anirudh', previewUrl: 'https://example.com/audio.m4a' };
assert.strictEqual(calculateDuration(previewTrack), 30, '30s preview should have total duration 30s');
assert.strictEqual(getChorusOffset(30), 14, 'Chorus hook should default to 14s for 30s preview');
assert.strictEqual(formatSec(14), '0:14');
assert.strictEqual(formatSec(29), '0:29');

// 2. Test full uploaded track
const uploadedTrack = { id: 'upload-1', title: 'My Full Song', artist: 'School Band', previewUrl: 'data:audio/mp3;base64,AAAA' };
assert.strictEqual(calculateDuration(uploadedTrack), 180, 'Uploaded song should have duration > 60s');
assert.strictEqual(getChorusOffset(180), 60, 'Chorus hook should default to 60s for full song');
assert.strictEqual(formatSec(75), '1:15');
assert.strictEqual(formatSec(150), '2:30');

// 3. Test presets calculation
function getPresets(totalSeconds) {
  const isFullSong = totalSeconds > 60;
  return [
    { label: '🔥 Main Chorus', start: isFullSong ? 60 : 14 },
    { label: '⚡ Peak Drop', start: isFullSong ? 90 : 20 },
    { label: '🎵 Verse', start: isFullSong ? 30 : 6 },
    { label: '🎬 Intro', start: 0 },
  ];
}

const previewPresets = getPresets(30);
assert.strictEqual(previewPresets[0].start, 14);
assert.strictEqual(previewPresets[1].start, 20);

const fullPresets = getPresets(240);
assert.strictEqual(fullPresets[0].start, 60);
assert.strictEqual(fullPresets[1].start, 90);

console.log('✅ All song chorus and trimmer unit tests passed successfully!');
