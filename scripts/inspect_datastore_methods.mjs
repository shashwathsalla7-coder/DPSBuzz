import fs from 'fs';

const content = fs.readFileSync('src/lib/dataStore.ts', 'utf8');

function findMethods(names) {
  for (const name of names) {
    const regex = new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*[:{]`, 'g');
    let match;
    console.log(`=== METHOD: ${name} ===`);
    while ((match = regex.exec(content)) !== null) {
      const start = match.index;
      console.log(content.slice(start, start + 400));
      console.log('---------------------------');
    }
  }
}

findMethods([
  'requestFollow', 'acceptFollowRequest', 'rejectFollowRequest', 'cancelFollowRequest',
  'isFollowing', 'isFollowRequested', 'getFollowers', 'getFollowing', 'getMutualFollows',
  'canMessage', 'createGroup', 'getGroups', 'joinGroup', 'addMemberToGroup',
  'getGroupJoinRequests', 'acceptGroupJoinRequest', 'rejectGroupJoinRequest'
]);
