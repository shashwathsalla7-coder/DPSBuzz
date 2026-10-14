import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function checkWoff2(filePath) {
  const buf = fs.readFileSync(filePath);
  // WOFF2 signature: 'wOF2' (0x774F4632)
  const tag = buf.toString('ascii', 0, 4);
  if (tag !== 'wOF2') return { error: 'Not woff2' };

  // Compressed stream starts after header and table directory
  // Let's find the brotli stream:
  // In WOFF2, header is 48 bytes.
  // numTables is uint16 at offset 12.
  const numTables = buf.readUInt16BE(12);
  const totalSfntSize = buf.readUInt32BE(16);
  const totalCompressedSize = buf.readUInt32BE(20);

  // Search for Brotli compressed stream or try decompressing slices
  let decompressed = null;
  for (let offset = 48; offset < Math.min(buf.length, 300); offset++) {
    try {
      const slice = buf.subarray(offset, offset + totalCompressedSize);
      decompressed = zlib.brotliDecompressSync(slice);
      if (decompressed) break;
    } catch {}
  }

  if (decompressed) {
    const decStr = decompressed.toString('latin1');
    const hasTnum = decStr.includes('tnum');
    const hasPnum = decStr.includes('pnum');
    const hasLnum = decStr.includes('lnum');
    return { success: true, size: decompressed.length, hasTnum, hasPnum, hasLnum };
  }

  return { success: false, note: 'Could not locate brotli offset directly' };
}

console.log('Satoshi Variable:', checkWoff2(path.resolve('public/fonts/Satoshi-Variable.woff2')));
console.log('Cabinet Grotesk Variable:', checkWoff2(path.resolve('public/fonts/CabinetGrotesk-Variable.woff2')));
console.log('Cabinet Grotesk Bold:', checkWoff2(path.resolve('public/fonts/CabinetGrotesk-Bold.woff2')));
