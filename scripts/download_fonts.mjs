import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontUrls = {
  'CabinetGrotesk-Variable.woff2': 'https://cdn.fontshare.com/wf/J2PZYZURCR7HNQKXCZ4VXYA3K5FFCCLT/PZSZLWHMBCE7FFGOUYDEU33FAESUMA3X/JFDL5FBAQ2WMYL3LGKSCZKAIFCS2UQ63.woff2',
  'CabinetGrotesk-Bold.woff2': 'https://cdn.fontshare.com/wf/XMXWOHABYLQDJ42L65EFRYNVRY37HQCB/B2O4O6V3JMFM2WDCYQI3A47L5U4THDUL/WN5274VQ3AUBDFP74GB4EC4XYJ3EKVNE.woff2',
  'CabinetGrotesk-Extrabold.woff2': 'https://cdn.fontshare.com/wf/ZX6AQLSFYVDPN2URWO2MQFGTYYOHIS64/TPYPKOYWFQVNJHLLRXD4KFYX4LUOUW4Z/6QH2ALVTTK7IRVO5MYOQQ3OZNXW5SSS3.woff2',
  'Satoshi-Variable.woff2': 'https://cdn.fontshare.com/wf/NWBQYJIM7GCZ5XWD7D26ARB3VDY55ZRT/K63EV2KZIGKLE7RANQ2U42S6SVHU5RJ7/X6XYTKIVDUW7GZTZPZNN4EUM5KH54KHF.woff2',
};

async function downloadFonts() {
  for (const [filename, url] of Object.entries(fontUrls)) {
    console.log(`Downloading ${filename} from ${url}...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download ${url}: ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const dest = path.join(fontsDir, filename);
    fs.writeFileSync(dest, buffer);
    console.log(`Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
}

downloadFonts().catch((err) => {
  console.error(err);
  process.exit(1);
});
