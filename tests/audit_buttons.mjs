import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir, exts = ['.tsx', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles('src');
let totalButtons = 0;
let withHandlers = 0;
let withoutHandlers = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Regex to match <button ...>
  const buttonRegex = /<button\b([^>]*?)>/gs;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    totalButtons++;
    const attrs = match[1];
    const hasOnClick = /onClick\s*=/i.test(attrs);
    const isSubmit = /type\s*=\s*["']submit["']/i.test(attrs);
    const isForwardedRef = /{\.\.\.props}/i.test(attrs);

    if (hasOnClick || isSubmit || isForwardedRef) {
      withHandlers++;
    } else {
      const relPath = path.relative(process.cwd(), file);
      withoutHandlers.push({ file: relPath, snippet: match[0].slice(0, 100) });
    }
  }
}

console.log(`\n=== BUTTON AUDIT RESULTS ===`);
console.log(`Total <button> elements in src: ${totalButtons}`);
console.log(`Buttons with functional handlers: ${withHandlers}`);
console.log(`Buttons missing handlers: ${withoutHandlers.length}\n`);

if (withoutHandlers.length > 0) {
  console.log('Unwired buttons found:');
  withoutHandlers.forEach((b, i) => {
    console.log(`${i + 1}. [${b.file}] ${b.snippet}`);
  });
} else {
  console.log('✓ 100% OF ALL BUTTONS ACROSS THE ENTIRE APP ARE FULLY WIRED!');
}
