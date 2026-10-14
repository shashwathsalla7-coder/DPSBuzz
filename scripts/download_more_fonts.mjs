import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve('public/fonts');

async function getWoff2FromCss(cssUrl, userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36') {
  const res = await fetch(cssUrl, {
    headers: { 'User-Agent': userAgent },
  });
  const text = await res.text();
  const matches = [...text.matchAll(/url\((['"]?)(https?:)?\/\/([^'")]+)\1\)/g)];
  return { css: text, urls: matches.map(m => (m[2] || 'https:') + '//' + m[3]) };
}

async function run() {
  // Kalam
  const kalam = await getWoff2FromCss('https://fonts.googleapis.com/css2?family=Kalam:wght@400&subset=latin&display=swap');
  console.log('Kalam CSS matches:', kalam.urls);
  if (kalam.urls[0]) {
    const res = await fetch(kalam.urls[0]);
    fs.writeFileSync(path.join(fontsDir, 'Kalam-Regular.woff2'), Buffer.from(await res.arrayBuffer()));
    console.log('Saved Kalam-Regular.woff2');
  }

  // IBM Plex Mono 400, 500
  const ibm = await getWoff2FromCss('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&subset=latin&display=swap');
  console.log('IBM Plex Mono CSS matches:', ibm.urls);
  if (ibm.urls[0]) {
    const res = await fetch(ibm.urls[0]);
    fs.writeFileSync(path.join(fontsDir, 'IBMPlexMono-Regular.woff2'), Buffer.from(await res.arrayBuffer()));
    console.log('Saved IBMPlexMono-Regular.woff2');
  }
  if (ibm.urls[1]) {
    const res = await fetch(ibm.urls[1]);
    fs.writeFileSync(path.join(fontsDir, 'IBMPlexMono-Medium.woff2'), Buffer.from(await res.arrayBuffer()));
    console.log('Saved IBMPlexMono-Medium.woff2');
  }

  // Gambetta (Fontshare)
  const gambetta = await getWoff2FromCss('https://api.fontshare.com/v2/css?f[]=gambetta@700&display=swap');
  console.log('Gambetta CSS matches:', gambetta.urls);
  if (gambetta.urls[0]) {
    const res = await fetch(gambetta.urls[0]);
    fs.writeFileSync(path.join(fontsDir, 'Gambetta-Bold.woff2'), Buffer.from(await res.arrayBuffer()));
    console.log('Saved Gambetta-Bold.woff2');
  }
}

run().catch(console.error);
