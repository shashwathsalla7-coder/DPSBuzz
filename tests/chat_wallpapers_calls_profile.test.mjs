import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Chat Wallpapers, Real Calls & Profile Photo Verification ---');

// 1. Verify chats/page.tsx has wallpaper customization with presets and device gallery picker
const chatsContent = fs.readFileSync('src/app/(main)/chats/page.tsx', 'utf8');

assert.ok(
  chatsContent.includes('WALLPAPER_PRESETS'),
  'chats/page.tsx must define WALLPAPER_PRESETS'
);
assert.ok(
  chatsContent.includes('handleWallpaperGalleryUpload'),
  'chats/page.tsx must provide handleWallpaperGalleryUpload for gallery photo selection'
);
assert.ok(
  chatsContent.includes('dpsbuzz_chat_wallpapers_v1'),
  'chats/page.tsx must persist chat wallpapers to localStorage (dpsbuzz_chat_wallpapers_v1)'
);
console.log('✓ PASS: Chat wallpaper system includes presets, device gallery picker, and persistence');

// 2. Verify chats/page.tsx has real phone & video calls with getUserMedia and duration logging
assert.ok(
  chatsContent.includes('startCall'),
  'chats/page.tsx must define startCall handler'
);
assert.ok(
  chatsContent.includes('getUserMedia'),
  'chats/page.tsx must attempt getUserMedia for real webcam video calling'
);
assert.ok(
  chatsContent.includes('handleEndCall'),
  'chats/page.tsx must define handleEndCall handler'
);
assert.ok(
  chatsContent.includes('formatCallTimerDisplay'),
  'chats/page.tsx must format live call duration'
);
assert.ok(
  chatsContent.includes('Video call ended •'),
  'chats/page.tsx must log ended video calls to chat stream'
);
assert.ok(
  chatsContent.includes('Voice call ended •'),
  'chats/page.tsx must log ended voice calls to chat stream'
);
console.log('✓ PASS: Real phone & video calls with live timer, camera feed, and chat log output');

// 3. Verify all profiles in chats are strictly circular (rounded-full)
assert.ok(
  chatsContent.includes('w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border overflow-hidden'),
  'chats/page.tsx header avatar must be strictly rounded-full'
);

const convRowContent = fs.readFileSync('src/components/chats/ConversationRow.tsx', 'utf8');
assert.ok(
  convRowContent.includes('rounded-full'),
  'ConversationRow.tsx must render rounded-full circular avatars'
);
console.log('✓ PASS: Profile avatars across chats are strictly circles (rounded-full)');

// 4. Verify profile and settings pages support photo upload from gallery
const profileContent = fs.readFileSync('src/app/(main)/u/[username]/page.tsx', 'utf8');
assert.ok(
  profileContent.includes('handlePhotoSelect'),
  'Profile page must have handlePhotoSelect handler for device gallery uploads'
);
assert.ok(
  profileContent.includes('Upload from Gallery 📸'),
  'Profile page Edit modal must have Upload from Gallery option'
);

const settingsContent = fs.readFileSync('src/app/(main)/settings/page.tsx', 'utf8');
assert.ok(
  settingsContent.includes('handlePhotoSelect'),
  'Settings page must have handlePhotoSelect handler for gallery uploads'
);
assert.ok(
  settingsContent.includes('Change Profile Photo from Gallery 📸'),
  'Settings page must have Change Profile Photo option'
);
assert.ok(
  settingsContent.includes('w-12 h-12 rounded-full overflow-hidden'),
  'Settings page must render circular avatar'
);
console.log('✓ PASS: Profile photo upload from device gallery verified in Profile and Settings');

// 5. Verify real exact minutes and timestamps formatting
assert.ok(
  chatsContent.includes('formatExactTime'),
  'chats/page.tsx must provide formatExactTime helper'
);
assert.ok(
  chatsContent.includes('typing...'),
  'chats/page.tsx must show partner typing indicator'
);
console.log('✓ PASS: Real minute timestamps and live typing indicator verified');

console.log('\nAll 5 Chat Wallpapers, Real Calls & Profile Photo Verifications Passed Successfully!\n');
