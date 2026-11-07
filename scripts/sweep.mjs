// Rebrand sweep matching sweep.py logic exactly
import fs from 'fs';
import path from 'path';

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.next', '.nuxt', '.svelte-kit', 'dist', 'build',
  'out', '.vercel', '.turbo', '.cache', 'coverage', '__pycache__', '.venv',
  'venv', 'Pods', '.expo', 'DerivedData', '.gradle'
]);

const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'Podfile.lock', 'Cargo.lock', 'poetry.lock'
]);

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.icns', '.pdf', '.zip',
  '.gz', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mov', '.mp3',
  '.wav', '.avif', '.heic', '.psd', '.sketch', '.fig', '.jar', '.so', '.dylib'
]);

const HEX_REGEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g;

function normHex(h) {
  h = h.toLowerCase().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return '#' + h;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPatterns(avoid, domains) {
  const pats = [];
  for (let name of avoid) {
    name = name.trim();
    if (!name) continue;
    const parts = name.split(/[\s_-]+/).filter(Boolean).map(escapeRegex);
    pats.push({
      kind: 'name',
      label: name,
      rx: new RegExp(parts.join('[\\s_-]?'), 'i')
    });
  }
  for (let d of domains) {
    d = d.trim().toLowerCase();
    if (d) {
      pats.push({
        kind: 'domain',
        label: d,
        rx: new RegExp(escapeRegex(d), 'i')
      });
    }
  }
  return pats;
}

function isBinary(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXT.has(ext)) return true;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

function sweepDir(root, avoid = [], domains = [], colors = [], includeReplica = false, maxSize = 2000000) {
  const pats = buildPatterns(avoid, domains);
  const targetColors = new Set(colors.map(c => normHex(c)));
  const hits = [];
  const absRoot = path.resolve(root);

  function walk(currentDir) {
    const relDir = path.relative(absRoot, currentDir) || '.';
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const name = entry.name;
      const fullPath = path.join(currentDir, name);
      const relPath = path.join(relDir, name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        if (name === 'replica' && relDir === '.' && !includeReplica) continue;

        // Check directory name against patterns
        for (const pat of pats) {
          if (pat.kind === 'name' && pat.rx.test(name)) {
            hits.push({
              file: relPath + '/',
              line: 0,
              kind: 'path',
              match: pat.label,
              text: 'folder name'
            });
          }
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (SKIP_FILES.has(name)) continue;

        // Check filename
        for (const pat of pats) {
          if (pat.kind === 'name' && pat.rx.test(name)) {
            hits.push({
              file: relPath,
              line: 0,
              kind: 'path',
              match: pat.label,
              text: 'file name'
            });
          }
        }

        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > maxSize || isBinary(fullPath)) continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pat of pats) {
              if (pat.rx.test(line)) {
                hits.push({
                  file: relPath,
                  line: i + 1,
                  kind: pat.kind,
                  match: pat.label,
                  text: line.trim().slice(0, 160)
                });
              }
            }
            if (targetColors.size > 0) {
              let match;
              HEX_REGEX.lastIndex = 0;
              while ((match = HEX_REGEX.exec(line)) !== null) {
                const nh = normHex(match[0]);
                if (targetColors.has(nh)) {
                  hits.push({
                    file: relPath,
                    line: i + 1,
                    kind: 'color',
                    match: nh,
                    text: line.trim().slice(0, 160)
                  });
                }
              }
            }
          }
        } catch (e) {
          // ignore read error
        }
      }
    }
  }

  walk(absRoot);
  return hits;
}

function render(hits) {
  if (hits.length === 0) {
    return 'Clean. Nothing of the original\'s name, domain or colours found.';
  }
  const out = [];
  const byKind = {};
  for (const h of hits) {
    byKind[h.kind] = (byKind[h.kind] || 0) + 1;
    const loc = h.line === 0 ? h.file : `${h.file}:${h.line}`;
    out.push(`${h.kind.padEnd(7)} ${h.match.slice(0, 18).padEnd(18)} ${loc}  ${h.text}`);
  }
  out.push('');
  const kindSummary = Object.entries(byKind).sort().map(([k, v]) => `${k} ${v}`).join(', ');
  out.push(`${hits.length} hits (${kindSummary}). Replace every one before you launch.`);
  return out.join('\n');
}

// CLI argument parsing
const args = process.argv.slice(2);
let root = '.';
let avoid = [];
let domains = [];
let colors = [];
let configPath = null;
let includeReplica = false;
let jsonOut = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--config' && i + 1 < args.length) {
    configPath = args[++i];
  } else if (arg === '--avoid' && i + 1 < args.length) {
    avoid = avoid.concat(args[++i].split(','));
  } else if (arg === '--domains' && i + 1 < args.length) {
    domains = domains.concat(args[++i].split(','));
  } else if (arg === '--colors' && i + 1 < args.length) {
    colors = colors.concat(args[++i].split(','));
  } else if (arg === '--include-replica') {
    includeReplica = true;
  } else if (arg === '--json') {
    jsonOut = true;
  } else if (!arg.startsWith('-')) {
    root = arg;
  }
}

if (configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const cfg = JSON.parse(raw);
    if (cfg.avoid) avoid = avoid.concat(cfg.avoid);
    if (cfg.domains) domains = domains.concat(cfg.domains);
    if (cfg.colors) colors = colors.concat(cfg.colors);
  } catch (e) {
    console.error(`sweep: ${e.message}`);
    process.exit(2);
  }
}

avoid = avoid.map(s => s.trim()).filter(Boolean);
domains = domains.map(s => s.trim()).filter(Boolean);
colors = colors.map(s => s.trim()).filter(Boolean);

if (avoid.length === 0 && domains.length === 0 && colors.length === 0) {
  console.error('sweep: nothing to look for. Pass --avoid with the original app\'s name.');
  process.exit(2);
}

const hits = sweepDir(root, avoid, domains, colors, includeReplica);
if (jsonOut) {
  console.log(JSON.stringify(hits, null, 2));
} else {
  console.log(render(hits));
}

if (hits.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
