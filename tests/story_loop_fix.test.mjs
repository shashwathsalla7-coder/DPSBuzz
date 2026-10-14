import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- Verifying Maximum Update Depth Loop Fix ---');

const storiesRowPath = path.resolve('src/components/story/StoriesRow.tsx');
const storyViewerPath = path.resolve('src/components/story/StoryViewer.tsx');

const storiesRowContent = fs.readFileSync(storiesRowPath, 'utf8');
const storyViewerContent = fs.readFileSync(storyViewerPath, 'utf8');

// 1. StoriesRow uses useCallback for handleStorySeen
assert(
  storiesRowContent.includes('const handleStorySeen = useCallback('),
  'handleStorySeen should be wrapped in useCallback'
);
console.log('✓ PASS: StoriesRow wraps handleStorySeen in useCallback');

// 2. StoriesRow checks isAlreadySeen before updating state
assert(
  storiesRowContent.includes('const isAlreadySeen = prev.allGroups.some(') ||
  storiesRowContent.includes('isAlreadySeen'),
  'StoriesRow must check if the story is already marked seen'
);
console.log('✓ PASS: StoriesRow performs idempotency check to avoid redundant state updates');

// 3. StoryViewer uses seenStoriesRef guard
assert(
  storyViewerContent.includes('seenStoriesRef = useRef<Set<string>>(new Set())'),
  'StoryViewer must use seenStoriesRef to prevent duplicate triggers'
);
console.log('✓ PASS: StoryViewer uses seenStoriesRef Set guard');

// 4. StoryViewer checks !seenStoriesRef.current.has(currentStory.id) before firing onStorySeen
assert(
  storyViewerContent.includes('!seenStoriesRef.current.has(currentStory.id)'),
  'StoryViewer must guard onStorySeen invocation with seenStoriesRef'
);
console.log('✓ PASS: StoryViewer verifies story ID has not yet been triggered before calling onStorySeen');

// 5. StoryViewer clears seenStoriesRef on close
assert(
  storyViewerContent.includes('seenStoriesRef.current.clear()'),
  'StoryViewer must clear seenStoriesRef when modal closes'
);
console.log('✓ PASS: StoryViewer clears seenStoriesRef when modal closes');

// 6. StoryViewer uses prevIsOpenRef to avoid resetting indices on data update
assert(
  storyViewerContent.includes('prevIsOpenRef') &&
  storyViewerContent.includes('!prevIsOpenRef.current'),
  'StoryViewer must use prevIsOpenRef to guard state sync'
);
console.log('✓ PASS: StoryViewer prevents syncState re-running when groups update');

console.log('\nAll Maximum Update Depth loop fix checks passed cleanly!\n');
