import fs from 'fs';

const content = fs.readFileSync('src/lib/dataStore.ts', 'utf8');

function printSection(startPattern, length) {
  const idx = content.search(startPattern);
  if (idx !== -1) {
    console.log(content.slice(idx, idx + length));
  } else {
    console.log('Not found:', startPattern);
  }
}

console.log('--- getFollows & getFollowRequests ---');
printSection(/getFollows\(\)/, 1200);

console.log('--- requestFollow ---');
printSection(/requestFollow\(requester:/, 1500);

console.log('--- acceptFollowRequest ---');
printSection(/acceptFollowRequest\(target:/, 1500);
