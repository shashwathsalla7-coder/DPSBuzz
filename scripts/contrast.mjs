// Contrast checker conforming exactly to WCAG 2.2 contrast ratio formulas
import fs from 'fs';

const HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NEEDS = {
  normal: [4.5, 7.0],
  large: [3.0, 4.5],
  ui: [3.0, 3.0]
};

function parseHex(hex) {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`Not a hex color: ${hex}`);
  let h = m[1];
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function luminance(rgb) {
  const chan = c => {
    c = c / 255.0;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(chan);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const la = luminance(parseHex(fg));
  const lb = luminance(parseHex(bg));
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function flatten(obj, prefix = '') {
  let out = {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    if (typeof obj.value === 'string') {
      out[prefix] = obj.value;
      return out;
    }
    if (typeof obj.$value === 'string') {
      out[prefix] = obj.$value;
      return out;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('$') || k.startsWith('_')) continue;
      const key = prefix ? `${prefix}-${k}` : k;
      Object.assign(out, flatten(v, key));
    }
  } else if (typeof obj === 'string' && HEX.test(obj.trim())) {
    out[prefix] = obj.trim();
  }
  return out;
}

function getColors(tokens) {
  const src = tokens.color || tokens.colors || tokens.colour || {};
  const flat = flatten(src);
  const res = {};
  for (const [k, v] of Object.entries(flat)) {
    if (HEX.test(v)) res[k] = v;
  }
  return res;
}

function defaultPairs(cols) {
  const keys = Object.keys(cols);
  const fg = keys.filter(k => /(^|-)(text|fg|on)(-|$)/i.test(k));
  const bg = keys.filter(k => /(^|-)(bg|background|surface)(-|$)/i.test(k));
  const pairs = [];
  for (const f of fg) {
    for (const b of bg) {
      pairs.push([f, b]);
    }
  }
  return pairs;
}

function check(cols, pairs) {
  const rows = [];
  for (const p of pairs) {
    if (p.length < 2) continue;
    const [fg, bg] = p;
    let size = p[2] || 'normal';
    if (!NEEDS[size]) size = 'normal';
    if (!cols[fg] || !cols[bg]) {
      rows.push({ fg, bg, size, error: `unknown token (fg: ${cols[fg]}, bg: ${cols[bg]})` });
      continue;
    }
    const r = ratio(cols[fg], cols[bg]);
    const [aa, aaa] = NEEDS[size];
    rows.push({
      fg,
      bg,
      size,
      ratio: Math.round(r * 100) / 100,
      aa: r >= aa,
      aaa: r >= aaa,
      fg_hex: cols[fg],
      bg_hex: cols[bg]
    });
  }
  return rows;
}

function render(rows) {
  const out = [];
  for (const r of rows) {
    if (r.error) {
      out.push(`  ??    ${r.fg.padEnd(24)} on ${r.bg.padEnd(20)} ${r.error}`);
      continue;
    }
    let grade = r.aaa ? 'AAA' : (r.aa ? 'AA' : 'FAIL');
    if (r.size === 'ui') grade = r.aa ? 'PASS' : 'FAIL';
    out.push(`  ${grade.padEnd(5)} ${r.ratio.toFixed(2).padStart(5)}:1  ${r.fg.padEnd(24)} on ${r.bg.padEnd(20)} ${r.size === 'normal' ? '' : r.size}`);
  }
  const fails = rows.filter(r => r.error || !r.aa).length;
  out.push('');
  out.push(`  ${rows.length} pairs, ${fails} failing AA`);
  return { text: out.join('\n'), fails };
}

const tokenPath = process.argv[2] || 'replica/design/tokens.json';
const raw = fs.readFileSync(tokenPath, 'utf8');
const tokens = JSON.parse(raw);
const cols = getColors(tokens);
const pairs = tokens.pairs || defaultPairs(cols);
const rows = check(cols, pairs);
const { text, fails } = render(rows);
console.log(text);
if (fails > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
