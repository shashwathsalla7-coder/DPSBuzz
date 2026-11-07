import fs from 'fs';
import path from 'path';

// 1. Delete tsconfig.tsbuildinfo
if (fs.existsSync('tsconfig.tsbuildinfo')) {
  fs.unlinkSync('tsconfig.tsbuildinfo');
  console.log('Deleted tsconfig.tsbuildinfo');
}

// 2. Clean tests/test-ticks-and-typing.mjs
const testPath = 'tests/test-ticks-and-typing.mjs';
if (fs.existsSync(testPath)) {
  let content = fs.readFileSync(testPath, 'utf8');
  content = content.replace(/reciprocal Campus Wire privacy/g, 'reciprocal privacy');
  fs.writeFileSync(testPath, content, 'utf8');
  console.log(`Updated ${testPath}`);
}

// 3. Rename script files containing 'wire'
const scriptDir = 'scripts';
const entries = fs.readdirSync(scriptDir);
for (const fn of entries) {
  if (fn.includes('wire')) {
    const oldPath = path.join(scriptDir, fn);
    const newName = fn.replace(/wire/g, 'wire');
    const newPath = path.join(scriptDir, newName);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
  }
}

// 4. Content replacements across all scripts
const updatedEntries = fs.readdirSync(scriptDir);
for (const fn of updatedEntries) {
  const fullPath = path.join(scriptDir, fn);
  if (fs.statSync(fullPath).isFile() && (fn.endsWith('.mjs') || fn.endsWith('.js') || fn.endsWith('.json'))) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const orig = content;

    content = content.replace(/Campus Wire/g, 'Campus Wire');
    content = content.replace(/wire/g, 'wire');
    content = content.replace(/campus_wire_channels/g, 'campus_wire_channels');
    content = content.replace(/campus_wire_messages/g, 'campus_wire_messages');
    content = content.replace(/#00a884/gi, '#00a884');
    content = content.replace(/#161f2e/gi, '#161f2e');
    content = content.replace(/#3730a3/gi, '#3730a3');

    if (content !== orig) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated content: ${fullPath}`);
    }
  }
}

console.log('Script files cleaned.');
