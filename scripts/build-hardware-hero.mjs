import { readFile, writeFile } from 'node:fs/promises';
const placements = [
  ['ecrans', 0, 36, 500, 363],
  ['pc-fixes', 406, 0, 350, 390],
  ['claviers', 76, 300, 460, 240],
  ['souris', 490, 318, 185, 230],
];
const pieces = await Promise.all(
  placements.map(async ([name, x, y, width, height]) => {
    const svg = await readFile(`public/univers/vector/${name}.svg`, 'utf8');
    const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 400 290">${body}</svg>`;
  }),
);
await writeFile(
  'public/brand/hardware-setup.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 560" role="img" aria-label="Ensemble ordinateur, écran, clavier et souris"><ellipse cx="380" cy="466" rx="316" ry="20" fill="#E3DAF2"/>${pieces.join('')}</svg>\n`,
);
