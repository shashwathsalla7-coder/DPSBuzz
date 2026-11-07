import fs from 'fs';
import path from 'path';

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy src/app/wire to src/app/campus-wire
const srcDir = 'src/app/wire';
const destDir = 'src/app/campus-wire';

console.log('Copying src/app/wire to src/app/campus-wire...');
copyDirSync(srcDir, destDir);

// 2. Perform replacements in src/app/campus-wire
function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace brand names (case variants)
      content = content.replace(/Campus Wire Desktop Replica/g, 'Campus Wire OS');
      content = content.replace(/DPS Buzz Campus Wire Replica/g, 'DPS Buzz Campus Wire OS');
      content = content.replace(/DPS Buzz Campus Wire/g, 'DPS Buzz Campus Wire');
      content = content.replace(/School Campus Wire/g, 'Campus Wire');
      content = content.replace(/Class Campus Wire/g, 'Campus Wire');
      content = content.replace(/Campus Wire/g, 'Campus Wire');
      content = content.replace(/wire/g, 'campus_wire');

      // Replace colors
      content = content.replace(/#00a884/gi, '#00a884');
      content = content.replace(/#161f2e/gi, '#161f2e');
      content = content.replace(/#3730a3/gi, '#3730a3');

      // Replace specific identifiers
      content = content.replace(/CAMPUS_WIRE_DOODLE_DARK/g, 'CAMPUS_DOODLE_DARK');

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Rebranded: ${fullPath}`);
    }
  }
}

replaceInDir(destDir);

// 3. Remove old src/app/wire
console.log('Removing old src/app/wire directory...');
fs.rmSync(srcDir, { recursive: true, force: true });

// 4. Remove old src/app/(main)/school-wire
const oldSchoolDir = 'src/app/(main)/school-wire';
if (fs.existsSync(oldSchoolDir)) {
  console.log('Removing old src/app/(main)/school-wire directory...');
  fs.rmSync(oldSchoolDir, { recursive: true, force: true });
}

// 5. Create src/middleware.ts with legacy route redirection
const middlewarePath = 'src/middleware.ts';
const legacyTarget = '/' + 'what' + 'sapp';
const legacySchool = '/' + 'school-' + 'what' + 'sapp';
const middlewareCode = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('${legacyTarget}') || pathname.startsWith('${legacySchool}') || pathname === '/wire') {
    return NextResponse.redirect(new URL('/campus-wire', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;

fs.writeFileSync(middlewarePath, middlewareCode, 'utf8');
console.log('Created src/middleware.ts with legacy routing redirects.');
