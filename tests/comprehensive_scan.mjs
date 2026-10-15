import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir, exts = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  try {
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
  } catch (e) {}
  return results;
}

const files = getFiles('src');

console.log('Total files found in src:', files.length);

// ==========================================
// 1. Scan for alert() or prompt() or confirm()
// ==========================================
const alerts = [];
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\b(alert|prompt|confirm)\s*\(/.test(line) && !line.trim().startsWith('//')) {
      alerts.push({
        file: path.relative(process.cwd(), f),
        line: i + 1,
        code: line.trim(),
      });
    }
  });
});

console.log(`\n=== 1. ALERT / CONFIRM / PROMPT CALLS (${alerts.length}) ===`);
alerts.forEach((a) => {
  console.log(`- [${a.file}:${a.line}] ${a.code}`);
});

// ==========================================
// 2. Scan for empty / dummy handlers
// ==========================================
const emptyHandlers = [];
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line) ||
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*undefined\s*\}/.test(line) ||
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*null\s*\}/.test(line) ||
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*void\s+0\s*\}/.test(line) ||
      /href\s*=\s*["']#["']/.test(line)
    ) {
      emptyHandlers.push({
        file: path.relative(process.cwd(), f),
        line: i + 1,
        code: line.trim(),
      });
    }
  });
});

console.log(`\n=== 2. EMPTY HANDLERS / DUMMY LINKS (${emptyHandlers.length}) ===`);
emptyHandlers.forEach((h) => {
  console.log(`- [${h.file}:${h.line}] ${h.code}`);
});

// ==========================================
// 3. Scan all Link href destinations
// ==========================================
// Collect all defined routes in src/app
const routes = new Set();
function findRoutes(dir, currentRoute = '') {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item.startsWith('(') && item.endsWith(')')) {
        // route group like (main), (auth)
        findRoutes(fullPath, currentRoute);
      } else if (item.startsWith('@')) {
        // parallel route
        findRoutes(fullPath, currentRoute);
      } else {
        findRoutes(fullPath, `${currentRoute}/${item}`);
      }
    } else if (item === 'page.tsx' || item === 'page.jsx' || item === 'page.js') {
      routes.add(currentRoute || '/');
    }
  }
}
findRoutes('src/app');

console.log(`\n=== ALL VALID PAGES IN APP (${routes.size}) ===`);
for (const r of Array.from(routes).sort()) {
  console.log(`  ${r}`);
}

const linkRegex = /<Link\b[^>]*?href\s*=\s*["']([^"']+)["']/g;
const brokenLinks = [];
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1].split('?')[0].split('#')[0];
    if (href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/uploads') && !href.startsWith('/icon') && !href.startsWith('/manifest')) {
      // Check if href matches a route (handling dynamic routes like /u/[username] or /notices/[id])
      const matches = Array.from(routes).some((r) => {
        if (r === href) return true;
        // Turn dynamic route like /u/[username] into regex /u/[^/]+
        const pattern = new RegExp('^' + r.replace(/\[\.\.\.[^\]]+\]/g, '.*').replace(/\[[^\]]+\]/g, '[^/]+') + '$');
        return pattern.test(href);
      });
      if (!matches) {
        brokenLinks.push({
          file: path.relative(process.cwd(), f),
          href,
          snippet: match[0],
        });
      }
    }
  }
});

console.log(`\n=== 3. POTENTIAL BROKEN LINKS (${brokenLinks.length}) ===`);
brokenLinks.forEach((b) => {
  console.log(`- [${b.file}] Link href="${b.href}" -> No matching page found!`);
});

// ==========================================
// 4. Scan for TODO, FIXME, "coming soon", "not implemented"
// ==========================================
const todos = [];
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/(TODO|FIXME|coming soon|not implemented|under construction)/i.test(line) && !f.includes('test')) {
      todos.push({
        file: path.relative(process.cwd(), f),
        line: i + 1,
        code: line.trim(),
      });
    }
  });
});

console.log(`\n=== 4. PLACEHOLDERS / TODOS / COMING SOON (${todos.length}) ===`);
todos.forEach((t) => {
  console.log(`- [${t.file}:${t.line}] ${t.code}`);
});

// ==========================================
// 5. Scan for broken imports or missing files
// ==========================================
const missingImports = [];
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const importRegex = /import\s+(?:(?:(?:\*\s+as\s+\w+)|(?:[\w\s,{}]+))\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolved = path.resolve(path.dirname(f), importPath);
      const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '.json', '.css'];
      const exists = possibleExtensions.some((ext) => fs.existsSync(resolved + ext));
      if (!exists) {
        missingImports.push({ file: path.relative(process.cwd(), f), importPath });
      }
    } else if (importPath.startsWith('@/')) {
      const relative = importPath.slice(2);
      const resolved = path.resolve('src', relative);
      const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '.json', '.css'];
      const exists = possibleExtensions.some((ext) => fs.existsSync(resolved + ext));
      if (!exists) {
        missingImports.push({ file: path.relative(process.cwd(), f), importPath });
      }
    }
  }
});

console.log(`\n=== 5. MISSING OR BROKEN IMPORTS (${missingImports.length}) ===`);
missingImports.forEach((m) => {
  console.log(`- [${m.file}] cannot resolve "${m.importPath}"`);
});
