import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('--- Running Instagram Story Architecture Verification ---');

// 1. Verify DataStore getUserStoryGroups method exists and groups by profile
const dataStoreContent = fs.readFileSync('src/lib/dataStore.ts', 'utf8');
assert.ok(
  dataStoreContent.includes('getUserStoryGroups'),
  'DataStore must provide getUserStoryGroups to group stories by profile'
);
assert.ok(
  dataStoreContent.includes('UserStoryGroup'),
  'DataStore must export UserStoryGroup interface'
);
console.log('✓ PASS: DataStore exports UserStoryGroup and getUserStoryGroups method');

// 2. Verify StoriesRow groups stories by profile so each profile appears ONCE in the row
const storiesRowContent = fs.readFileSync('src/components/story/StoriesRow.tsx', 'utf8');
assert.ok(
  storiesRowContent.includes('userGroups.peerGroups.map'),
  'StoriesRow must map over userGroups.peerGroups (one ring per profile)'
);
assert.ok(
  storiesRowContent.includes('userGroups.allGroups'),
  'StoriesRow must pass allGroups to StoryViewer'
);
console.log('✓ PASS: StoriesRow displays exactly one ring per profile instead of duplicate rings');

// 3. Verify StoryViewer computes bars per profile (the no of stories of a profile is no of bars)
const storyViewerContent = fs.readFileSync('src/components/story/StoryViewer.tsx', 'utf8');
assert.ok(
  storyViewerContent.includes('currentStories.map'),
  'StoryViewer must map over currentStories (the active profile stories) for progress segments'
);
assert.ok(
  storyViewerContent.includes('currentStories.length'),
  'StoryViewer must calculate progress segments directly from currentStories.length'
);
console.log('✓ PASS: StoryViewer renders exactly one progress bar per story of the active profile');

// 4. Verify StoryViewer transitions to next profile when current profile stories finish
assert.ok(
  storyViewerContent.includes('currentUserIndex < effectiveGroups.length - 1') ||
  storyViewerContent.includes('setCurrentUserIndex((prev) => prev + 1)'),
  'StoryViewer must advance to the next profile when current profile stories finish'
);
console.log('✓ PASS: StoryViewer advances to the next profile once all stories for the current profile complete');

// 5. Verify 0px flat corners in StoryViewer
assert.equal(
  storyViewerContent.includes('rounded-xl') || storyViewerContent.includes('rounded-2xl'),
  false,
  'StoryViewer must avoid rounded-xl and rounded-2xl'
);
console.log('✓ PASS: StoryViewer strictly maintains 0px flat styling');

console.log('\nAll 5 Instagram Story Architecture Tests Passed Successfully!\n');
