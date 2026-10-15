import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Story Activity Privacy Tests ---');

const storyViewerPath = path.resolve('src/components/story/StoryViewer.tsx');
const code = fs.readFileSync(storyViewerPath, 'utf8');

// 1. Verify Activity Sheet Modal Guard
assert(
  code.includes('{showActivitySheet && isOwnStory && ('),
  'Story Activity Sheet Modal must be strictly guarded by isOwnStory'
);
console.log('✓ PASS: Story Activity Sheet Modal is strictly restricted to story creator (isOwnStory)');

// 2. Verify Swipe-Up Gesture Guard
assert(
  code.includes('if (isOwnStory && deltaY < -70'),
  'Swipe-up gesture to open Activity Sheet must be restricted to isOwnStory'
);
console.log('✓ PASS: Swipe-up gesture to inspect story activity is restricted to story creator');

// 3. Verify Classmate View (Other Viewers) Does NOT Have Views Pill
const classmateSection = code.split('{isOwnStory ? (')[1]?.split('{showActivitySheet')[0];
assert(classmateSection, 'Classmate story section must exist in StoryViewer');

assert(
  !classmateSection.includes('See who saw this story'),
  'Classmate story view must NOT contain "See who saw this story" pill'
);
assert(
  classmateSection.includes('handleToggleLike') && classmateSection.includes('handleSendStoryReply'),
  'Classmate story view must retain reply message input and like heart button'
);
console.log('✓ PASS: Classmate story view hides view count and viewer inspection controls');

// 4. Verify Own Story Section Retains Activity & Insights Bar
const ownStorySection = code.split('{isOwnStory ? (')[1]?.split(') : (')[0];
assert(ownStorySection, 'Own story section must exist');
assert(
  ownStorySection.includes('View story activity and insights') &&
  ownStorySection.includes('currentViewsCount') &&
  ownStorySection.includes('currentLikesCount'),
  'Own story section must display member view count, likes count, and Activity button to creator'
);
console.log('✓ PASS: Creator of the story maintains full access to Activity and viewer insights');

console.log('\nAll Story Activity Privacy tests passed successfully! 👁️🔒✨');
